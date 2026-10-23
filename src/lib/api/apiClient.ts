// The only place the API base URL is defined.
export const API_BASE_URL = 'https://task-api.cashmine.io';

// Client-side cap per request; a timed-out claim is treated as "outcome unknown".
export const REQUEST_TIMEOUT_MS = 15_000;

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'invalid_response';

export interface ApiErrorDetails { status?: number; code?: string; field?: string; retryAfterMs?: number }

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  field?: string;
  retryAfterMs?: number;

  constructor(kind: ApiErrorKind, message: string, details: ApiErrorDetails = {}) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = details.status;
    this.code = details.code;
    this.field = details.field;
    this.retryAfterMs = details.retryAfterMs;
  }
}

const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];
const CLAIM_REJECTED_STATUSES = [400, 401, 409];

const httpStatus = (e: unknown): number | undefined =>
  e instanceof ApiError && e.kind === 'http' ? e.status : undefined;

export function isRetryableRead(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (e.kind === 'network' || e.kind === 'timeout') return true;
  return e.kind === 'http' && e.status !== undefined && RETRYABLE_STATUSES.includes(e.status);
}

export function isDefinitiveClaimRejection(e: unknown): boolean {
  const status = httpStatus(e);
  return status !== undefined && CLAIM_REJECTED_STATUSES.includes(status);
}

export function isUnauthorized(e: unknown): boolean {
  return httpStatus(e) === 401;
}

export function userMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return 'Something went wrong. Please try again.';
  switch (e.kind) {
    case 'network':
      return "Can't reach CashMine. Check your connection.";
    case 'timeout':
      return 'CashMine is taking too long to respond. Please try again.';
    case 'invalid_response':
      return 'CashMine sent an unexpected response. Please try again.';
  }
  const status = e.status ?? 0;
  if (status === 400) return e.code === 'VALIDATION' ? e.message : 'The request was not valid.';
  if (status === 401) return 'Your token was rejected or has expired.';
  if (status === 404) return "We couldn't find that.";
  if (status === 409) return 'This request conflicts with an earlier one.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'CashMine is having trouble right now. Please try again.';
  return `Something went wrong (HTTP ${status}).`;
}

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export interface RequestOptions<T> {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  guard: (data: unknown) => data is T;
}

export interface ApiResponse<T> { data: T; status: number; headers: Headers }

export async function request<T>(token: string, path: string, opts: RequestOptions<T>): Promise<ApiResponse<T>> {
  const { method = 'GET', body, signal } = opts;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  let res: Response;
  let text: string;
  try {
    res = await fetch(API_BASE_URL + path, {
      method,
      headers: {
        ...opts.headers,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    text = await res.text();
  } catch (e) {
    if (timedOut) throw new ApiError('timeout', 'Request timed out');
    if (signal?.aborted) throw e; // cancelled by the caller (e.g. React Query): not an API failure
    throw new ApiError('network', 'Network request failed');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (!res.ok) throw httpError(res, text);

  const data = parseJson(text);
  if (!opts.guard(data)) {
    throw new ApiError('invalid_response', `Unexpected response from ${path.split('?')[0]}`, { status: res.status });
  }
  return { data, status: res.status, headers: res.headers };
}

// JSON.parse never yields undefined, so undefined means "not JSON".
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// Builds an `http` ApiError from the `{ error: { code, message, field?, retryAfterMs? } }` envelope,
// falling back to status-only when the body isn't that shape (e.g. an HTML 503 page).
function httpError(res: Response, text: string): ApiError {
  const json = parseJson(text);
  const env = isRecord(json) && isRecord(json.error) ? json.error : {};
  const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

  let retryAfterMs =
    typeof env.retryAfterMs === 'number' && Number.isFinite(env.retryAfterMs) && env.retryAfterMs >= 0
      ? env.retryAfterMs
      : undefined;
  if (res.status === 429 && retryAfterMs === undefined) {
    retryAfterMs = retryAfterHeaderMs(res.headers.get('Retry-After'));
  }

  return new ApiError('http', str(env.message) ?? `Request failed (HTTP ${res.status})`, {
    status: res.status,
    code: str(env.code),
    field: str(env.field),
    retryAfterMs,
  });
}

// Retry-After in seconds → ms. (The HTTP-date form isn't used by this API.)
function retryAfterHeaderMs(header: string | null): number | undefined {
  if (header === null || header.trim() === '') return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}
