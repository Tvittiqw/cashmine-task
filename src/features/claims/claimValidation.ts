import type { ClaimOptionsDto } from '../../lib/api/endpoints';
import { normalizeInput, parseUnits, validateClaimAmount, type ClaimAmountError } from '../../lib/money';

export interface ClaimCheck {
  /** The server's min/fee can't be read at this asset's precision: claiming is unsafe. */
  optionsBroken: boolean;
  /** Max is offered only when the whole available balance is itself a valid claim size. */
  canMax: boolean;
  result: ReturnType<typeof validateClaimAmount> | null;
}

export function checkClaim(
  input: string,
  balance: { decimals: number; available: bigint },
  options: ClaimOptionsDto,
): ClaimCheck {
  const min = parseUnits(options.minAmount, balance.decimals);
  const fee = parseUnits(options.fee, balance.decimals);
  if (!min.ok || !fee.ok) return { optionsBroken: true, canMax: false, result: null };
  return {
    optionsBroken: false,
    canMax: balance.available >= min.units,
    result: validateClaimAmount({
      input: normalizeInput(input),
      decimals: balance.decimals,
      available: balance.available,
      min: min.units,
      fee: fee.units,
    }),
  };
}

export function claimAmountErrorMessage(
  error: ClaimAmountError,
  ctx: { asset: string; decimals: number; minAmount: string; fee: string; available: string },
): string {
  switch (error) {
    case 'empty':
      return 'Enter an amount.';
    case 'format':
      return 'Enter a number like 0.5 (one decimal point, no spaces or thousands separators).';
    case 'too_many_decimals':
      return `${ctx.asset} allows up to ${ctx.decimals} decimal places.`;
    case 'below_min':
      return `The minimum claim is ${ctx.minAmount} ${ctx.asset}.`;
    case 'above_available':
      return `You have ${ctx.available} ${ctx.asset} available.`;
    case 'fee_exceeds_amount':
      return `The amount must be more than the ${ctx.fee} ${ctx.asset} fee.`;
  }
}
