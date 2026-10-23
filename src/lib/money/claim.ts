// Client-side claim amount validation, in the same order the server checks (spec §3.3).
import { formatUnits, parseUnits, type ParseError } from './decimal';

export type ClaimAmountError = ParseError | 'below_min' | 'above_available' | 'fee_exceeds_amount';

/**
 * Validates a claim amount. `input` must already be normalized (normalizeInput) by the caller.
 * Fee is a flat amount taken from the claimed amount: receive = amount − fee.
 */
export function validateClaimAmount(p: {
  input: string;
  decimals: number;
  available: bigint;
  min: bigint;
  fee: bigint;
}):
  | { ok: true; amount: bigint; fee: bigint; receive: bigint }
  | { ok: false; error: ClaimAmountError } {
  const parsed = parseUnits(p.input, p.decimals);
  if (!parsed.ok) return parsed;

  const amount = parsed.units;
  if (amount < p.min) return { ok: false, error: 'below_min' }; // includes zero, like the server
  if (amount > p.available) return { ok: false, error: 'above_available' };
  // Receiving nothing (or less) is never a valid claim.
  if (amount <= p.fee) return { ok: false, error: 'fee_exceeds_amount' };

  return { ok: true, amount, fee: p.fee, receive: amount - p.fee };
}

/** The exact, canonical string the Max button fills in. */
export function maxInput(available: bigint, decimals: number): string {
  return formatUnits(available, decimals);
}
