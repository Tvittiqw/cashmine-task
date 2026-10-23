import type { ClaimDto, ClaimStatus } from '../../lib/api/endpoints';
import { parseUnits } from '../../lib/money';
import type { Balance } from '../balances/model';

export interface DisplayBalance extends Balance {
  /** Server-confirmed claims applied on top of a snapshot that predates them. */
  adjustedBy: ClaimDto[];
}

/** Change per unit of the claim amount: -1n, 0n or 1n for each balance field. */
interface Effect {
  available: bigint;
  claiming: bigint;
}

const NO_EFFECT: Effect = { available: 0n, claiming: 0n };

/** The snapshot predates the claim, so the amount hasn't left `available` yet. */
const CREATED_AFTER_SNAPSHOT: Record<ClaimStatus, Effect> = {
  pending: { available: -1n, claiming: 1n },
  completed: { available: -1n, claiming: 0n },
  failed: NO_EFFECT,
};

/** The snapshot still counts the claim in `claiming`, but it has settled since. */
const SETTLED_AFTER_SNAPSHOT: Record<ClaimStatus, Effect> = {
  pending: NO_EFFECT,
  completed: { available: 0n, claiming: -1n },
  failed: { available: 1n, claiming: -1n },
};

function effectOnSnapshot(claim: ClaimDto, snapshotAt: number): Effect {
  if (Date.parse(claim.createdAt) > snapshotAt) return CREATED_AFTER_SNAPSHOT[claim.status];
  if (Date.parse(claim.updatedAt) > snapshotAt) return SETTLED_AFTER_SNAPSHOT[claim.status];
  return NO_EFFECT;
}

/**
 * D2 option C: brings a snapshot up to date with claims the server has already confirmed. Once a
 * newer snapshot arrives, every effect is zero again, so the balance never drops and jumps back.
 */
export function applyTrackedClaims(asOf: string, balances: Balance[], claims: ClaimDto[]): DisplayBalance[] {
  const snapshotAt = Date.parse(asOf);
  return balances.map((b) => {
    let available = b.available;
    let claiming = b.claiming;
    const adjustedBy: ClaimDto[] = [];
    for (const c of claims) {
      if (c.asset !== b.asset) continue;
      const effect = effectOnSnapshot(c, snapshotAt);
      const parsed = parseUnits(c.amount, b.decimals);
      if (effect === NO_EFFECT || !parsed.ok) continue;
      available += effect.available * parsed.units;
      claiming += effect.claiming * parsed.units;
      adjustedBy.push(c);
    }
    // Should never happen; never show a negative balance.
    if (available < 0n) available = 0n;
    if (claiming < 0n) claiming = 0n;
    return { ...b, available, claiming, adjustedBy };
  });
}
