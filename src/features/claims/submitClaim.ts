import { ApiError, isDefinitiveClaimRejection } from '../../lib/api/apiClient';
import { createClaim, type ClaimDto } from '../../lib/api/endpoints';
import type { ClaimIntent } from './store';

export type SubmitOutcome =
  | { kind: 'created'; claim: ClaimDto }
  | { kind: 'rejected'; error: ApiError } // 400/401/409: definitely not created
  | { kind: 'unknown'; error: unknown }; // may or may not exist: never send with a new key

const BACKOFF_MS = [1_000, 2_000, 4_000];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * D3: sends the intent and, while the outcome is unknown, re-sends the identical body with the
 * same Idempotency-Key. The API returns the original claim for a repeated key, so this can never
 * create a second claim.
 */
export async function sendClaimIntent(token: string, intent: ClaimIntent, sleep = wait): Promise<SubmitOutcome> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const { claim } = await createClaim(token, intent.body, intent.key);
      return { kind: 'created', claim };
    } catch (e) {
      if (isDefinitiveClaimRejection(e)) return { kind: 'rejected', error: e as ApiError };
      lastError = e;
      if (attempt < BACKOFF_MS.length) {
        await sleep(e instanceof ApiError && e.retryAfterMs ? e.retryAfterMs : BACKOFF_MS[attempt]);
      }
    }
  }
  return { kind: 'unknown', error: lastError };
}
