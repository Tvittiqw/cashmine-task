/// <reference types="jest" />
import type { ClaimDto } from '../../../lib/api/endpoints';
import { failedClaimNotice, failureMessage } from '../claimFormatting';

const failed = {
  amount: '10',
  asset: 'USDT',
  status: 'failed',
  failureReason: 'The destination rejected the transfer.',
} as ClaimDto;

describe('claimFormatting', () => {
  it('does not double the full stop after the server reason', () => {
    expect(failureMessage(failed)).toBe('The destination rejected the transfer. 10 USDT is back in your available balance.');
  });

  it('adds a full stop when the reason has none', () => {
    expect(failureMessage({ ...failed, failureReason: 'Limit reached' })).toBe(
      'Limit reached. 10 USDT is back in your available balance.',
    );
  });

  it('works without a reason', () => {
    expect(failureMessage({ ...failed, failureReason: null })).toBe('10 USDT is back in your available balance.');
  });

  it('builds the Home notice', () => {
    expect(failedClaimNotice(failed)).toBe(
      'Your claim of 10 USDT failed. The destination rejected the transfer. 10 USDT is back in your available balance.',
    );
  });
});
