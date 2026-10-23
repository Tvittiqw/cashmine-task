import { useMemo } from 'react';
import { applyTrackedClaims } from '../claims/reconcile';
import { useClaims } from '../claims/store';
import { useBalances } from './useBalances';

/** Latest snapshot with this browser's confirmed-but-not-yet-reflected claims applied (D2). */
export function useDisplayBalances() {
  const query = useBalances();
  const { tracked } = useClaims();
  const balances = useMemo(
    () => (query.data ? applyTrackedClaims(query.data.asOf, query.data.balances, tracked) : null),
    [query.data, tracked],
  );
  return { query, balances, asOf: query.data?.asOf ?? null };
}
