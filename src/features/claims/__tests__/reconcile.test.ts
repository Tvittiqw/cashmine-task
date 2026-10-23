/// <reference types="jest" />
import type { ClaimDto } from '../../../lib/api/endpoints';
import type { Balance } from '../../balances/model';
import { applyTrackedClaims } from '../reconcile';

const AS_OF = '2026-10-23T08:00:00.000Z';

const usdt: Balance = {
  asset: 'USDT',
  decimals: 6,
  available: 100_000_000n, // 100
  pending: 0n,
  claiming: 0n,
  usdPrice: '1',
};

function claim(over: Partial<ClaimDto>): ClaimDto {
  return {
    id: 'clm_1',
    asset: 'USDT',
    amount: '10',
    fee: '1.5',
    receiveAmount: '8.5',
    destinationId: 'dest_wallet',
    status: 'pending',
    failureReason: null,
    createdAt: '2026-10-23T08:00:05.000Z',
    updatedAt: '2026-10-23T08:00:05.000Z',
    ...over,
  };
}

const run = (claims: ClaimDto[], balances: Balance[] = [usdt]) => applyTrackedClaims(AS_OF, balances, claims)[0];

describe('applyTrackedClaims (D2 option C)', () => {
  it('leaves balances alone without claims', () => {
    expect(run([])).toEqual({ ...usdt, adjustedBy: [] });
  });

  it('ignores a claim the snapshot already includes', () => {
    const r = run([claim({ createdAt: '2026-10-23T07:59:59.000Z' })]);
    expect(r.available).toBe(100_000_000n);
    expect(r.adjustedBy).toHaveLength(0);
  });

  it('treats createdAt == asOf as already in the snapshot', () => {
    expect(run([claim({ createdAt: AS_OF })]).available).toBe(100_000_000n);
  });

  it('moves a newer pending claim from available to claiming, total unchanged', () => {
    const r = run([claim({})]);
    expect(r.available).toBe(90_000_000n);
    expect(r.claiming).toBe(10_000_000n);
    expect(r.available + r.pending + r.claiming).toBe(100_000_000n);
    expect(r.adjustedBy.map((c) => c.id)).toEqual(['clm_1']);
  });

  it('subtracts a completed claim from available only', () => {
    const r = run([claim({ status: 'completed' })]);
    expect(r.available).toBe(90_000_000n);
    expect(r.claiming).toBe(0n);
  });

  it('ignores a failed claim (amount is back in available)', () => {
    const r = run([claim({ status: 'failed' })]);
    expect(r.available).toBe(100_000_000n);
    expect(r.adjustedBy).toHaveLength(0);
  });

  it('ignores claims for other assets', () => {
    expect(run([claim({ asset: 'BTC' })]).available).toBe(100_000_000n);
  });

  it('adds up several claims on the same asset', () => {
    const r = run([claim({ id: 'a', amount: '10' }), claim({ id: 'b', amount: '20.5' })]);
    expect(r.available).toBe(69_500_000n);
    expect(r.claiming).toBe(30_500_000n);
  });

  it('never shows a negative available balance', () => {
    expect(run([claim({ amount: '150' })]).available).toBe(0n);
  });
});
