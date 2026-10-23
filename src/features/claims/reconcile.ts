import type { ClaimDto } from '../../lib/api/endpoints';
import { parseUnits } from '../../lib/money';
import type { Balance } from '../balances/model';

export interface DisplayBalance extends Balance {
  /** Server-confirmed claims applied on top of a snapshot that predates them. */
  adjustedBy: ClaimDto[];
}

interface Delta {
  available: bigint;
  claiming: bigint;
}

const NONE: Delta = { available: 0n, claiming: 0n };

/**
 * What the snapshot taken at `snapshotAt` is missing about one claim:
 * - created after the snapshot: the amount hasn't left `available` yet (unless the claim failed);
 * - created before but settled after: the snapshot still counts it in `claiming`.
 */
function missingFromSnapshot(c: ClaimDto, amount: bigint, snapshotAt: number): Delta {
  const createdAfter = Date.parse(c.createdAt) > snapshotAt;
  if (createdAfter) {
    if (c.status === 'pending') return { available: -amount, claiming: amount };
    if (c.status === 'completed') return { available: -amount, claiming: 0n };
    return NONE;
  }
  const settledAfter = c.status !== 'pending' && Date.parse(c.updatedAt) > snapshotAt;
  if (!settledAfter) return NONE;
  if (c.status === 'failed') return { available: amount, claiming: -amount };
  return { available: 0n, claiming: -amount };
}

/**
 * D2 option C: brings a snapshot up to date with claims the server has already confirmed. Once a
 * newer snapshot arrives, every delta is zero again, so the balance never drops and jumps back.
 */
export function applyTrackedClaims(asOf: string, balances: Balance[], claims: ClaimDto[]): DisplayBalance[] {
  const snapshotAt = Date.parse(asOf);
  return balances.map((b) => {
    let available = b.available;
    let claiming = b.claiming;
    const adjustedBy: ClaimDto[] = [];
    for (const c of claims) {
      if (c.asset !== b.asset) continue;
      const parsed = parseUnits(c.amount, b.decimals);
      if (!parsed.ok) continue;
      const delta = missingFromSnapshot(c, parsed.units, snapshotAt);
      if (delta === NONE) continue;
      available += delta.available;
      claiming += delta.claiming;
      adjustedBy.push(c);
    }
    // Should never happen; never show a negative balance.
    if (available < 0n) available = 0n;
    if (claiming < 0n) claiming = 0n;
    return { ...b, available, claiming, adjustedBy };
  });
}
