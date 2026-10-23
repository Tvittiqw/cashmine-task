import type { ActivityItemDto } from '../../lib/api/endpoints';

export type AmountTone = 'credit' | 'debit' | 'void';

export function activityTitle(item: ActivityItemDto): string {
  switch (item.type) {
    case 'accrual':
      return item.exchange ? `Payback from ${item.exchange}` : 'Payback';
    case 'reversal':
      return item.exchange ? `Reversed by ${item.exchange}` : 'Reversal';
    case 'claim':
      return 'Claim';
  }
}

/** A failed claim never left the balance, so its amount is shown as void, not as a debit. */
export function isVoided(item: ActivityItemDto): boolean {
  return item.type === 'claim' && item.status === 'failed';
}

export function amountTone(item: ActivityItemDto): AmountTone {
  if (isVoided(item)) return 'void';
  return item.amount.startsWith('-') ? 'debit' : 'credit';
}

/** Amounts are shown exactly as the API returns them; only an explicit '+' is added to credits. */
export function activityAmountLabel(item: ActivityItemDto): string {
  const sign = item.amount.startsWith('-') ? '' : '+';
  return `${sign}${item.amount} ${item.asset}`;
}

export function activityStatusLabel(item: ActivityItemDto): string {
  if (isVoided(item)) return 'Failed · not deducted';
  if (item.type === 'claim' && item.status === 'pending') return 'Processing';
  return item.status.charAt(0).toUpperCase() + item.status.slice(1);
}

/** Only claims created by this account carry the claim id needed for the status screen. */
export function claimLink(item: ActivityItemDto): string | null {
  return item.type === 'claim' && item.relatedId ? `/claims/${item.relatedId}` : null;
}
