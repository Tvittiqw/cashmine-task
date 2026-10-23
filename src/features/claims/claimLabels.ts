import type { ClaimStatus } from '../../lib/api/endpoints';

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  pending: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export const CLAIM_PENDING_HINT = 'usually under 20 seconds';

export const RECEIVE_ROW_LABEL: Record<ClaimStatus, string> = {
  pending: 'To receive',
  completed: 'Received',
  failed: 'Not received',
};
