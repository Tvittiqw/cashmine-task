import { isRecord, request } from './apiClient';

// Transport shapes as the API sends them (amounts are decimal strings),
// plus hand-written runtime guards used by the client to reject malformed 2xx bodies.

export interface BalanceItemDto { asset: string; decimals: number; available: string; pending: string; claiming: string; usdPrice: string }
export interface BalancesDto { asOf: string; items: BalanceItemDto[] }
export type ActivityType = 'accrual' | 'reversal' | 'claim';
export interface ActivityItemDto { id: string; type: ActivityType; asset: string; amount: string; status: string; exchange: string | null; createdAt: string; relatedId: string | null }
export interface ActivityPageDto { items: ActivityItemDto[]; nextCursor: string | null }
export interface DestinationDto { id: string; label: string }
export interface ClaimOptionsDto { asset: string; minAmount: string; fee: string; destinations: DestinationDto[] }
export type ClaimStatus = 'pending' | 'completed' | 'failed';
export interface ClaimDto { id: string; asset: string; amount: string; fee: string; receiveAmount: string; destinationId: string; status: ClaimStatus; failureReason: string | null; createdAt: string; updatedAt: string }
export interface CreateClaimBody { asset: string; amount: string; destinationId: string }

// Same format the server enforces (also DECIMAL_RE in src/lib/money; kept local so the API layer stands alone).
const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d+)?$/;
// Activity amounts are signed: negative for reversals and claims.
const SIGNED_AMOUNT_RE = /^-?(0|[1-9]\d*)(\.\d+)?$/;
const ACTIVITY_TYPES: readonly string[] = ['accrual', 'reversal', 'claim'];
const CLAIM_STATUSES: readonly string[] = ['pending', 'completed', 'failed'];

const isString = (x: unknown): x is string => typeof x === 'string';
const isId = (x: unknown): boolean => isString(x) && x.length > 0;
const isNullableString = (x: unknown): boolean => x === null || isString(x);
const isAmount = (x: unknown): boolean => isString(x) && AMOUNT_RE.test(x);
const isSignedAmount = (x: unknown): boolean => isString(x) && SIGNED_AMOUNT_RE.test(x);
const isTimestamp = (x: unknown): boolean => isString(x) && !Number.isNaN(Date.parse(x));
const isDecimals = (x: unknown): boolean => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 36;

export function isBalanceItemDto(x: unknown): x is BalanceItemDto {
  return (
    isRecord(x) && isId(x.asset) && isDecimals(x.decimals) &&
    isAmount(x.available) && isAmount(x.pending) && isAmount(x.claiming) &&
    // Price format is checked by toUsd(), which excludes the asset from USD totals (D4)
    // instead of failing the whole balances response.
    isString(x.usdPrice)
  );
}

export function isBalancesDto(x: unknown): x is BalancesDto {
  return isRecord(x) && isTimestamp(x.asOf) && Array.isArray(x.items) && x.items.every(isBalanceItemDto);
}

export function isActivityItemDto(x: unknown): x is ActivityItemDto {
  return (
    isRecord(x) && isId(x.id) && isString(x.type) && ACTIVITY_TYPES.includes(x.type) &&
    isId(x.asset) && isSignedAmount(x.amount) && isString(x.status) &&
    isNullableString(x.exchange) && isTimestamp(x.createdAt) && isNullableString(x.relatedId)
  );
}

export function isActivityPageDto(x: unknown): x is ActivityPageDto {
  return isRecord(x) && Array.isArray(x.items) && x.items.every(isActivityItemDto) && isNullableString(x.nextCursor);
}

export function isDestinationDto(x: unknown): x is DestinationDto {
  return isRecord(x) && isId(x.id) && isString(x.label);
}

export function isClaimOptionsDto(x: unknown): x is ClaimOptionsDto {
  return (
    isRecord(x) && isId(x.asset) && isAmount(x.minAmount) && isAmount(x.fee) &&
    Array.isArray(x.destinations) && x.destinations.every(isDestinationDto)
  );
}

export function isClaimDto(x: unknown): x is ClaimDto {
  return (
    isRecord(x) && isId(x.id) && isId(x.asset) &&
    isAmount(x.amount) && isAmount(x.fee) && isAmount(x.receiveAmount) && isId(x.destinationId) &&
    isString(x.status) && CLAIM_STATUSES.includes(x.status) && isNullableString(x.failureReason) &&
    isTimestamp(x.createdAt) && isTimestamp(x.updatedAt)
  );
}

// The token is passed explicitly on every call and is never logged.
// The trailing `signal` lets React Query cancel reads; it is optional everywhere.

export async function getBalances(token: string, signal?: AbortSignal): Promise<BalancesDto> {
  const res = await request(token, '/v1/balances', { guard: isBalancesDto, signal });
  return res.data;
}

export async function getActivity(
  token: string,
  p: { limit?: number; cursor?: string | null },
  signal?: AbortSignal,
): Promise<ActivityPageDto> {
  const query = new URLSearchParams();
  if (p.limit !== undefined) query.set('limit', String(p.limit));
  if (p.cursor != null) query.set('cursor', p.cursor); // opaque: pass through, never parse
  const qs = query.toString();
  const res = await request(token, `/v1/activity${qs ? `?${qs}` : ''}`, { guard: isActivityPageDto, signal });
  return res.data;
}

export async function getClaimOptions(token: string, asset: string, signal?: AbortSignal): Promise<ClaimOptionsDto> {
  const res = await request(token, `/v1/claim-options?asset=${encodeURIComponent(asset)}`, {
    guard: isClaimOptionsDto,
    signal,
  });
  return res.data;
}

// 201 = created, 200 + `Idempotent-Replayed: true` = the original claim for this key.
// Any thrown error other than 400/401/409 means the outcome is unknown (see isDefinitiveClaimRejection).
export async function createClaim(
  token: string,
  body: CreateClaimBody,
  idempotencyKey: string,
): Promise<{ claim: ClaimDto; replayed: boolean }> {
  const res = await request(token, '/v1/claims', {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
    guard: isClaimDto,
  });
  return { claim: res.data, replayed: res.headers.get('Idempotent-Replayed') === 'true' };
}

export async function getClaim(token: string, id: string, signal?: AbortSignal): Promise<ClaimDto> {
  const res = await request(token, `/v1/claims/${encodeURIComponent(id)}`, { guard: isClaimDto, signal });
  return res.data;
}
