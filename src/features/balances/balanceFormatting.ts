import { formatAmountDisplay, formatUsd, toUsd } from '../../lib/money';
import type { DisplayBalance } from '../claims/reconcile';

export function availableLabel(b: DisplayBalance): string {
  return formatAmountDisplay(b.available, b.decimals);
}

export function availableUsdLabel(b: DisplayBalance): string {
  const usd = toUsd(b.available, b.decimals, b.usdPrice);
  return usd ? `≈ ${formatUsd(usd)}` : 'no price';
}

export function pendingLabel(b: DisplayBalance): string | null {
  if (b.pending === 0n) return null;
  return `Pending: ${formatAmountDisplay(b.pending, b.decimals)} (not yet confirmed)`;
}

export function claimingLabel(b: DisplayBalance): string | null {
  if (b.claiming === 0n) return null;
  return `Claiming: ${formatAmountDisplay(b.claiming, b.decimals)}`;
}

/** Explains a D2 overlay: the row reflects claims the latest snapshot hasn't caught up with. */
export function claimAdjustmentNote(b: DisplayBalance): string | null {
  if (b.adjustedBy.length === 0) return null;
  const amounts = b.adjustedBy.map((c) => c.amount).join(' + ');
  return `Reflects your claim of ${amounts} ${b.asset} · updating`;
}
