import { isClaimStatus, type ActivityItemDto } from '../../lib/api/endpoints';
import { CLAIM_STATUS_LABEL } from '../claims/claimLabels';
import { ACTIVITY_STATUS_LABEL, ACTIVITY_TITLE, EXCHANGE_TITLE, VOIDED_CLAIM_LABEL } from './activityLabels';

export type AmountTone = 'credit' | 'debit' | 'void';

export function activityTitle(item: ActivityItemDto): string {
  const withExchange = EXCHANGE_TITLE[item.type];
  return item.exchange && withExchange ? withExchange(item.exchange) : ACTIVITY_TITLE[item.type];
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
  if (isVoided(item)) return VOIDED_CLAIM_LABEL;
  if (item.type === 'claim' && isClaimStatus(item.status)) return CLAIM_STATUS_LABEL[item.status];
  return ACTIVITY_STATUS_LABEL[item.status] ?? item.status;
}

/** Only claims created by this account carry the claim id needed for the status screen. */
export function claimLink(item: ActivityItemDto): string | null {
  return item.type === 'claim' && item.relatedId ? `/claims/${item.relatedId}` : null;
}
