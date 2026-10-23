import type { ActivityType } from '../../lib/api/endpoints';

export const ACTIVITY_TITLE: Record<ActivityType, string> = {
  accrual: 'Payback',
  reversal: 'Reversal',
  claim: 'Claim',
};

/** Titles naming the exchange, for the types that come from one. */
export const EXCHANGE_TITLE: Partial<Record<ActivityType, (exchange: string) => string>> = {
  accrual: (exchange) => `Payback from ${exchange}`,
  reversal: (exchange) => `Reversed by ${exchange}`,
};

/** Accrual and reversal statuses; claim statuses reuse CLAIM_STATUS_LABEL. */
export const ACTIVITY_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
};

export const VOIDED_CLAIM_LABEL = 'Failed · not deducted';
