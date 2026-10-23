/// <reference types="jest" />
import type { ActivityItemDto } from '../../../lib/api/endpoints';
import {
  activityAmountLabel,
  activityStatusLabel,
  activityTitle,
  amountTone,
  claimLink,
} from '../activityFormatting';
import { mergeActivityPages } from '../activityPages';

function item(over: Partial<ActivityItemDto>): ActivityItemDto {
  return {
    id: 'act_1',
    type: 'accrual',
    asset: 'USDT',
    amount: '9.81',
    status: 'confirmed',
    exchange: 'Binance',
    createdAt: '2026-10-22T07:11:01.261Z',
    relatedId: null,
    ...over,
  };
}

describe('mergeActivityPages', () => {
  it('drops the item the API repeats at each page boundary, keeping order', () => {
    const pages = [
      { items: [item({ id: 'a' }), item({ id: 'b' })], nextCursor: 'x' },
      { items: [item({ id: 'b' }), item({ id: 'c' })], nextCursor: null },
    ];
    expect(mergeActivityPages(pages).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('handles no pages', () => {
    expect(mergeActivityPages([])).toEqual([]);
  });
});

describe('activityFormatting', () => {
  it('describes each type', () => {
    expect(activityTitle(item({}))).toBe('Payback from Binance');
    expect(activityTitle(item({ type: 'reversal', exchange: 'OKX', amount: '-3.1' }))).toBe('Reversed by OKX');
    expect(activityTitle(item({ type: 'claim', exchange: null, amount: '-60' }))).toBe('Claim');
  });

  it('shows amounts exactly as returned, with + on credits', () => {
    expect(activityAmountLabel(item({}))).toBe('+9.81 USDT');
    expect(activityAmountLabel(item({ amount: '-0.00004', asset: 'BTC' }))).toBe('-0.00004 BTC');
  });

  it('marks a failed claim as void rather than a debit', () => {
    const failed = item({ type: 'claim', amount: '-0.5', status: 'failed', exchange: null });
    expect(amountTone(failed)).toBe('void');
    expect(activityStatusLabel(failed)).toBe('Failed · not deducted');
    expect(amountTone(item({ type: 'claim', amount: '-60', status: 'completed' }))).toBe('debit');
    expect(amountTone(item({}))).toBe('credit');
  });

  it('labels statuses', () => {
    expect(activityStatusLabel(item({ status: 'pending' }))).toBe('Pending');
    expect(activityStatusLabel(item({ type: 'claim', status: 'pending', amount: '-10' }))).toBe('Processing');
  });

  it('links only claims that carry a claim id', () => {
    expect(claimLink(item({ type: 'claim', relatedId: 'clm_1', amount: '-10' }))).toBe('/claims/clm_1');
    expect(claimLink(item({ type: 'claim', relatedId: null, amount: '-10' }))).toBeNull();
    expect(claimLink(item({ type: 'reversal', relatedId: 'act_9', amount: '-3' }))).toBeNull();
  });
});
