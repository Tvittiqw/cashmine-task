import { ApiError, REQUEST_TIMEOUT_MS } from '../apiClient';
import { createClaim, getActivity, getBalances, getClaim, getClaimOptions } from '../endpoints';

const TOKEN = 'secret-token-123';

// Minimal stand-in for fetch's Response: only what client.ts reads.
function fakeResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => jest.useRealTimers());

const respond = (status: number, body: unknown, headers?: Record<string, string>) =>
  fetchMock.mockResolvedValueOnce(fakeResponse(status, body, headers));

async function caught(p: Promise<unknown>): Promise<ApiError> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error('expected the call to throw');
}

// §3.2-style fixtures
const BALANCES = {
  asOf: '2026-10-23T07:25:31.261Z',
  items: [
    { asset: 'USDT', decimals: 6, available: '870.533207', pending: '4.75', claiming: '0', usdPrice: '1.0002' },
    { asset: 'BTC', decimals: 8, available: '0.01246567', pending: '0', claiming: '0', usdPrice: '67312.45' },
    { asset: 'ETH', decimals: 18, available: '12.365678901234591676', pending: '0', claiming: '0', usdPrice: '2461.08' },
  ],
};
const CLAIM = {
  id: 'clm_1', asset: 'ETH', amount: '0.5', fee: '0.0012', receiveAmount: '0.4988',
  destinationId: 'dest_wallet', status: 'pending', failureReason: null,
  createdAt: '2026-10-23T08:00:00.000Z', updatedAt: '2026-10-23T08:00:00.000Z',
};
const BODY = { asset: 'ETH', amount: '0.5', destinationId: 'dest_wallet' };

describe('success paths', () => {
  it('parses balances and sends the bearer token', async () => {
    respond(200, BALANCES);
    await expect(getBalances(TOKEN)).resolves.toEqual(BALANCES);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://task-api.cashmine.io/v1/balances');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('builds the activity query, omitting a null cursor, and accepts signed amounts', async () => {
    const page = {
      items: [{ id: 'act_1', type: 'claim', asset: 'BTC', amount: '-0.001', status: 'completed', exchange: null, createdAt: '2026-10-01T00:00:00Z', relatedId: null }],
      nextCursor: null,
    };
    respond(200, page);
    respond(200, page);
    await expect(getActivity(TOKEN, { limit: 20, cursor: null })).resolves.toEqual(page);
    await getActivity(TOKEN, { limit: 5, cursor: 'eyJvIjoxOX0=' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://task-api.cashmine.io/v1/activity?limit=20');
    expect(fetchMock.mock.calls[1][0]).toBe('https://task-api.cashmine.io/v1/activity?limit=5&cursor=eyJvIjoxOX0%3D');
  });

  it('encodes the asset and claim id', async () => {
    respond(200, { asset: 'ETH', minAmount: '0.01', fee: '0.0012', destinations: [{ id: 'dest_wallet', label: 'Wallet' }] });
    respond(200, CLAIM);
    await getClaimOptions(TOKEN, 'E/T H');
    await getClaim(TOKEN, 'clm/1?x');
    expect(fetchMock.mock.calls[0][0]).toBe('https://task-api.cashmine.io/v1/claim-options?asset=E%2FT%20H');
    expect(fetchMock.mock.calls[1][0]).toBe('https://task-api.cashmine.io/v1/claims/clm%2F1%3Fx');
  });
});

describe('createClaim', () => {
  it('sends the Idempotency-Key and JSON body; 201 → replayed false', async () => {
    respond(201, CLAIM);
    await expect(createClaim(TOKEN, BODY, 'key-1')).resolves.toEqual({ claim: CLAIM, replayed: false });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://task-api.cashmine.io/v1/claims');
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('key-1');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(BODY);
  });

  it('200 + Idempotent-Replayed: true → replayed true', async () => {
    respond(200, CLAIM, { 'Idempotent-Replayed': 'true' });
    await expect(createClaim(TOKEN, BODY, 'key-1')).resolves.toEqual({ claim: CLAIM, replayed: true });
  });

  it('a 2xx with an unknown claim status is invalid_response', async () => {
    respond(201, { ...CLAIM, status: 'processing' });
    expect((await caught(createClaim(TOKEN, BODY, 'key-1'))).kind).toBe('invalid_response');
  });
});

describe('error normalisation', () => {
  it('400 envelope → http error with code, message and field', async () => {
    respond(400, { error: { code: 'VALIDATION', message: 'The minimum claim is 0.01 ETH', field: 'amount' } });
    const e = await caught(createClaim(TOKEN, BODY, 'key-1'));
    expect(e).toMatchObject({ kind: 'http', status: 400, code: 'VALIDATION', field: 'amount', message: 'The minimum claim is 0.01 ETH' });
  });

  it('429 uses retryAfterMs from the body over the header', async () => {
    respond(429, { error: { code: 'RATE_LIMITED', message: 'Too many requests', retryAfterMs: 2300 } }, { 'Retry-After': '3' });
    expect((await caught(getBalances(TOKEN))).retryAfterMs).toBe(2300);
  });

  it('429 without body retryAfterMs falls back to Retry-After seconds', async () => {
    respond(429, 'rate limited', { 'Retry-After': '6' });
    expect(await caught(getBalances(TOKEN))).toMatchObject({ kind: 'http', status: 429, retryAfterMs: 6000 });
  });

  it('503 with a non-JSON body → status-only http error', async () => {
    respond(503, '<html>Service Unavailable</html>');
    const e = await caught(getBalances(TOKEN));
    expect(e).toMatchObject({ kind: 'http', status: 503, code: undefined, message: 'Request failed (HTTP 503)' });
  });

  it('fetch rejection → network, without leaking the token', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const e = await caught(getBalances(TOKEN));
    expect(e.kind).toBe('network');
    expect(e.message).not.toContain(TOKEN);
  });

  it('no response within REQUEST_TIMEOUT_MS → timeout', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    const p = caught(getBalances(TOKEN));
    await jest.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    expect((await p).kind).toBe('timeout');
  });

  it('a caller abort is re-thrown as is (not a network error)', async () => {
    const abortError = new Error('aborted');
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(abortError))),
    );
    const caller = new AbortController();
    const p = getBalances(TOKEN, caller.signal);
    caller.abort();
    await expect(p).rejects.toBe(abortError);
  });

  it.each([
    ['unparsable JSON', 'not json'],
    ['missing keys', { items: [] }],
    ['numeric amount', { ...BALANCES, items: [{ ...BALANCES.items[0], available: 870.5 }] }],
    ['bad amount format', { ...BALANCES, items: [{ ...BALANCES.items[0], pending: '.5' }] }],
    ['decimals out of range', { ...BALANCES, items: [{ ...BALANCES.items[0], decimals: 37 }] }],
    ['bad asOf', { ...BALANCES, asOf: 'yesterday' }],
  ])('malformed 2xx (%s) → invalid_response', async (_name, body) => {
    respond(200, body);
    expect((await caught(getBalances(TOKEN))).kind).toBe('invalid_response');
  });
});
