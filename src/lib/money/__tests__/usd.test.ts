/// <reference types="jest" />
import { formatUnits, parseUnits } from '../decimal';
import { formatUsd, sumUsd, toUsd, type UsdValue } from '../usd';

function u(s: string, decimals: number): bigint {
  const r = parseUnits(s, decimals);
  if (!r.ok) throw new Error(`bad fixture ${s}: ${r.error}`);
  return r.units;
}

/** Exact decimal string of a UsdValue, for readable assertions. */
const exact = (v: UsdValue) => formatUnits(v.units, v.scale);

describe('toUsd', () => {
  it('multiplies exactly at decimals + price scale', () => {
    const v = toUsd(u('870.533207', 6), 6, '1.0002');
    expect(v).toEqual({ units: 8705332070000n + 1741066414n, scale: 10 });
    expect(exact(v!)).toBe('870.7073136414');
  });

  it('handles an integer price', () => {
    expect(toUsd(u('2', 8), 8, '100')).toEqual({ units: 200000000n * 100n, scale: 8 });
  });

  it.each(['', 'abc', '-1', '1e3', '.5', '1.', 'NaN', ' 1'])('returns null for invalid price %p', (price) => {
    expect(toUsd(u('1', 6), 6, price)).toBeNull();
  });
});

describe('sumUsd', () => {
  it('sums values at different scales exactly', () => {
    const total = sumUsd([
      { units: 150n, scale: 2 }, // 1.50
      { units: 25n, scale: 3 }, // 0.025
    ]);
    expect(total).toEqual({ units: 1525n, scale: 3 });
  });

  it('returns zero for an empty list', () => {
    expect(sumUsd([])).toEqual({ units: 0n, scale: 0 });
  });
});

describe('formatUsd', () => {
  it.each([
    [{ units: 0n, scale: 0 }, '$0.00'],
    [{ units: 12345678n, scale: 4 }, '$1,234.57'],
    [{ units: 1234567n, scale: 0 }, '$1,234,567.00'],
    [{ units: 5n, scale: 1 }, '$0.50'],
  ])('formats %p as %p', (v, expected) => {
    expect(formatUsd(v)).toBe(expected);
  });

  it('rounds half-up at the half cent', () => {
    expect(formatUsd({ units: 12345n, scale: 3 })).toBe('$12.35'); // 12.345 → up
    expect(formatUsd({ units: 123449999n, scale: 7 })).toBe('$12.34'); // just under half → down
    expect(formatUsd({ units: 5n, scale: 3 })).toBe('$0.01'); // 0.005 → up
    expect(formatUsd({ units: 4999n, scale: 6 })).toBe('$0.00');
    expect(formatUsd({ units: 999995n, scale: 6 })).toBe('$1.00'); // carries into dollars
  });

  it('rounds a real asset value once, at the end', () => {
    // 1 USDT-unit-scale amount: 0.005 USDT × $1 = $0.005 → $0.01
    expect(formatUsd(toUsd(u('0.005', 6), 6, '1')!)).toBe('$0.01');
  });

  it('formats negatives with the sign before $', () => {
    expect(formatUsd({ units: -12345n, scale: 3 })).toBe('-$12.35');
    expect(formatUsd({ units: -1n, scale: 6 })).toBe('$0.00'); // no "-$0.00"
  });
});

describe('multi-asset total (spec §3.2 live data, D4)', () => {
  // asset, decimals, available, pending, claiming, usdPrice
  const rows = [
    { decimals: 6, available: u('870.533207', 6), pending: u('4.75', 6), claiming: 0n, usdPrice: '1.0002' },
    { decimals: 8, available: u('0.01246567', 8), pending: 0n, claiming: 0n, usdPrice: '67312.45' },
    { decimals: 18, available: u('12.365678901234591676', 18), pending: 0n, claiming: 0n, usdPrice: '2461.08' },
  ];

  // By hand:
  //   USDT 870.533207 × 1.0002              =   870.7073136414
  //   USDT pending 4.75 × 1.0002            =     4.75095
  //   BTC  0.01246567 × 67312.45            =   839.0947885915
  //   ETH  12.365678901234591676 × 2461.08  = 30432.92503025042888197008
  //   total                                 = 32147.47808248332888197008 → $32,147.48
  //   available only                        = 32142.72713248332888197008 → $32,142.73
  it('matches the hand calculation for Total (available + pending + claiming)', () => {
    const total = sumUsd(
      rows.map((r) => toUsd(r.available + r.pending + r.claiming, r.decimals, r.usdPrice)!),
    );
    expect(exact(total)).toBe('32147.47808248332888197008');
    expect(formatUsd(total)).toBe('$32,147.48');
  });

  it('matches the hand calculation for Available to claim', () => {
    const avail = sumUsd(rows.map((r) => toUsd(r.available, r.decimals, r.usdPrice)!));
    expect(exact(avail)).toBe('32142.72713248332888197008');
    expect(formatUsd(avail)).toBe('$32,142.73');
  });

  it('excludes an asset with an invalid price instead of treating it as $0', () => {
    const values = [
      toUsd(rows[0].available, 6, rows[0].usdPrice),
      toUsd(rows[1].available, 8, 'n/a'), // BTC price broken
      toUsd(rows[2].available, 18, rows[2].usdPrice),
    ];
    expect(values[1]).toBeNull();
    const total = sumUsd(values.filter((v): v is UsdValue => v !== null));
    // 870.7073136414 + 30432.92503025042888197008
    expect(exact(total)).toBe('31303.63234389182888197008');
    expect(formatUsd(total)).toBe('$31,303.63');
  });
});
