import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useCallback, useRef, useState } from 'react';
import { userMessage } from '../../lib/api/apiClient';
import type { CreateClaimBody } from '../../lib/api/endpoints';
import { balancesQueryKey } from '../balances/useBalances';
import { reportUnauthorized, useRequiredToken } from '../token/TokenProvider';
import { useClaims, type ClaimIntent } from './store';
import { sendClaimIntent, type SubmitOutcome } from './submitClaim';

/**
 * Owns the claim intent lifecycle (D3): one Idempotency-Key per confirmed claim, safe re-sends
 * while the outcome is unknown, and recovery of an intent left over from an earlier attempt.
 * Navigation is left to the screen, based on the returned outcome.
 */
export function useClaimSubmission() {
  const token = useRequiredToken();
  const queryClient = useQueryClient();
  const { intent, setIntent, upsertClaim } = useClaims();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false); // guards double taps before the state update lands

  const send = useCallback(
    async (next: ClaimIntent): Promise<SubmitOutcome | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setSubmitting(true);
      setError(null);
      setIntent(next);
      const outcome = await sendClaimIntent(token, next);
      inFlight.current = false;
      setSubmitting(false);

      if (outcome.kind === 'created') {
        upsertClaim(outcome.claim);
        setIntent(null);
        void queryClient.invalidateQueries({ queryKey: balancesQueryKey });
      } else if (outcome.kind === 'rejected') {
        setIntent(null);
        if (outcome.error.status === 401) reportUnauthorized();
        else setError(userMessage(outcome.error));
        void queryClient.invalidateQueries({ queryKey: balancesQueryKey });
      } else {
        setIntent({ ...next, state: 'unknown' });
      }
      return outcome;
    },
    [token, queryClient, setIntent, upsertClaim],
  );

  const submit = useCallback(
    (body: CreateClaimBody) =>
      send({ key: randomUUID(), body, createdAt: new Date().toISOString(), state: 'sending' }),
    [send],
  );

  // Re-sends the stored intent with its original key: safe, never a second claim.
  const recheck = useCallback(() => (intent ? send(intent) : Promise.resolve(null)), [intent, send]);

  const dismiss = useCallback(() => setIntent(null), [setIntent]);

  return { intent, submitting, error, clearError: () => setError(null), submit, recheck, dismiss };
}
