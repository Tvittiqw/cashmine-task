import type { ClaimDto } from '../../lib/api/endpoints';
import { parseUnits } from '../../lib/money';
import type { Balance } from '../balances/model';

export interface DisplayBalance extends Balance {
  /** Server-confirmed claims applied on top of a snapshot that predates them. */
  adjustedBy: ClaimDto[];
}

/**
 * D2 option C: a claim the server has confirmed but the snapshot (taken at `asOf`) hasn't seen yet
 * is applied to it. Once a snapshot newer than the claim arrives, the overlay stops applying, so
 * the balance never drops and then jumps back. Only a failed claim gives money back.
 */
export function applyTrackedClaims(asOf: string, balances: Balance[], claims: ClaimDto[]): DisplayBalance[] {
  const snapshotAt = Date.parse(asOf);
  return balances.map((b) => {
    let available = b.available;
    let claiming = b.claiming;
    const adjustedBy: ClaimDto[] = [];
    for (const c of claims) {
      if (c.asset !== b.asset || c.status === 'failed') continue;
      if (Date.parse(c.createdAt) <= snapshotAt) continue; // already in the snapshot
      const parsed = parseUnits(c.amount, b.decimals);
      if (!parsed.ok) continue;
      available -= parsed.units;
      if (c.status === 'pending') claiming += parsed.units;
      adjustedBy.push(c);
    }
    if (available < 0n) available = 0n; // should never happen; never show a negative balance
    return { ...b, available, claiming, adjustedBy };
  });
}
