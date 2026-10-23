/// <reference types="jest" />
import type { ClaimDto } from '../../../lib/api/endpoints';
import type { DisplayBalance } from '../../claims/reconcile';
import { availableUsdLabel, claimAdjustmentNote, claimingLabel, pendingLabel } from '../balanceFormatting';

const eth: DisplayBalance = {
  asset: 'ETH',
  decimals: 18,
  available: 12_365_678_901_234_591_676n,
  pending: 0n,
  claiming: 0n,
  usdPrice: '2461.08',
  adjustedBy: [],
};

describe('balanceFormatting', () => {
  it('hides pending, claiming and the overlay note when there is nothing to show', () => {
    expect(pendingLabel(eth)).toBeNull();
    expect(claimingLabel(eth)).toBeNull();
    expect(claimAdjustmentNote(eth)).toBeNull();
  });

  it('labels pending and claiming amounts (truncated, never rounded up)', () => {
    const b = { ...eth, pending: 999_999_999_999_999_999n, claiming: 500_000_000_000_000_000n };
    expect(pendingLabel(b)).toBe('Pending: 0.99999999 (not yet confirmed)');
    expect(claimingLabel(b)).toBe('Claiming: 0.5');
  });

  it('explains which claims the overlay applied', () => {
    const adjustedBy = [{ amount: '0.5' }, { amount: '1' }] as ClaimDto[];
    expect(claimAdjustmentNote({ ...eth, adjustedBy })).toBe('Reflects your claim of 0.5 + 1 ETH · updating');
  });

  it('says "no price" instead of $0 when the price is unusable', () => {
    expect(availableUsdLabel({ ...eth, usdPrice: 'n/a' })).toBe('no price');
    expect(availableUsdLabel(eth)).toBe('≈ $30,432.93');
  });
});
