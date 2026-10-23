import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getClaim } from '../../lib/api/endpoints';
import { balancesQueryKey } from '../balances/useBalances';
import { useRequiredToken } from '../token/TokenProvider';
import { useClaims } from './store';

const FAST_POLL_MS = 3_000;
const SLOW_POLL_MS = 6_000;
const SLOW_AFTER_MS = 30_000;

/** Polls a claim until it settles and keeps the tracked copy (used by the balance overlay) in sync. */
export function useClaimStatus(id: string) {
  const token = useRequiredToken();
  const queryClient = useQueryClient();
  const { tracked, upsertClaim } = useClaims();
  const known = tracked.find((c) => c.id === id);

  const query = useQuery({
    queryKey: ['claim', id],
    queryFn: ({ signal }) => getClaim(token, id, signal),
    enabled: !!token && !!id,
    initialData: known,
    initialDataUpdatedAt: 0, // always confirm with the server
    refetchInterval: (q) => {
      const c = q.state.data;
      if (!c || c.status !== 'pending') return false;
      return Date.now() - Date.parse(c.createdAt) < SLOW_AFTER_MS ? FAST_POLL_MS : SLOW_POLL_MS;
    },
  });

  const latest = query.data;
  useEffect(() => {
    if (!latest || (known && known.status === latest.status && known.updatedAt === latest.updatedAt)) return;
    upsertClaim(latest);
    if (known?.status === 'pending' && latest.status !== 'pending') {
      void queryClient.invalidateQueries({ queryKey: balancesQueryKey });
    }
  }, [latest, known, upsertClaim, queryClient]);

  return query;
}
