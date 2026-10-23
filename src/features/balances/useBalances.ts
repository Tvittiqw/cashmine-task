import { useQuery } from '@tanstack/react-query';
import { getBalances } from '../../lib/api/endpoints';
import { useRequiredToken } from '../token/TokenProvider';
import { toBalances } from './model';

export const balancesQueryKey = ['balances'] as const;

// Snapshots are recomputed every 15 s; polling at 30 s keeps us well under the rate limit.
const REFETCH_MS = 30_000;

export function useBalances() {
  const token = useRequiredToken();
  return useQuery({
    queryKey: balancesQueryKey,
    queryFn: ({ signal }) => getBalances(token, signal),
    enabled: !!token,
    refetchInterval: REFETCH_MS,
    // A parse failure here surfaces as a query error instead of a crash.
    select: (dto) => ({ asOf: dto.asOf, balances: toBalances(dto) }),
  });
}
