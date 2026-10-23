/// <reference types="jest" />
import { ApiError } from '../../../lib/api/apiClient';
import { createClaim, type ClaimDto } from '../../../lib/api/endpoints';
import type { ClaimIntent } from '../store';
import { sendClaimIntent } from '../submitClaim';

jest.mock('../../../lib/api/endpoints', () => ({ createClaim: jest.fn() }));
const createClaimMock = createClaim as jest.MockedFunction<typeof createClaim>;

const intent: ClaimIntent = {
  key: 'key-1',
  body: { asset: 'USDT', amount: '10', destinationId: 'dest_wallet' },
  createdAt: '2026-10-23T08:00:00.000Z',
  state: 'sending',
};
const claim = { id: 'clm_1', status: 'pending' } as ClaimDto;
const noSleep = jest.fn(() => Promise.resolve());

beforeEach(() => {
  createClaimMock.mockReset();
  noSleep.mockClear();
});

describe('sendClaimIntent (D3)', () => {
  it('returns the created claim', async () => {
    createClaimMock.mockResolvedValueOnce({ claim, replayed: false });
    await expect(sendClaimIntent('t', intent, noSleep)).resolves.toEqual({ kind: 'created', claim });
  });

  it('re-sends the same key and body after a timeout and gets the original claim', async () => {
    createClaimMock
      .mockRejectedValueOnce(new ApiError('http', 'timeout', { status: 504, code: 'TIMEOUT' }))
      .mockRejectedValueOnce(new ApiError('network', 'offline'))
      .mockResolvedValueOnce({ claim, replayed: true });
    await expect(sendClaimIntent('t', intent, noSleep)).resolves.toEqual({ kind: 'created', claim });
    expect(createClaimMock).toHaveBeenCalledTimes(3);
    for (const call of createClaimMock.mock.calls) {
      expect(call).toEqual(['t', intent.body, 'key-1']);
    }
  });

  it('waits retryAfterMs after a 429', async () => {
    createClaimMock
      .mockRejectedValueOnce(new ApiError('http', 'slow down', { status: 429, retryAfterMs: 2300 }))
      .mockResolvedValueOnce({ claim, replayed: false });
    await sendClaimIntent('t', intent, noSleep);
    expect(noSleep).toHaveBeenCalledWith(2300);
  });

  it('stops at once on a definitive rejection', async () => {
    const error = new ApiError('http', 'Amount exceeds the available balance', { status: 400, code: 'VALIDATION' });
    createClaimMock.mockRejectedValueOnce(error);
    await expect(sendClaimIntent('t', intent, noSleep)).resolves.toEqual({ kind: 'rejected', error });
    expect(createClaimMock).toHaveBeenCalledTimes(1);
  });

  it('reports unknown after the retries run out, never using a new key', async () => {
    createClaimMock.mockRejectedValue(new ApiError('timeout', 'Request timed out'));
    const outcome = await sendClaimIntent('t', intent, noSleep);
    expect(outcome.kind).toBe('unknown');
    expect(createClaimMock).toHaveBeenCalledTimes(4);
    expect(new Set(createClaimMock.mock.calls.map((c) => c[2]))).toEqual(new Set(['key-1']));
  });
});
