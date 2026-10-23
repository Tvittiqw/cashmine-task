/// <reference types="jest" />
import { formatUnits, parseUnits } from '../decimal';
import { maxInput, validateClaimAmount } from '../claim';

/** Test helper: decimal string → base units (throws on bad fixtures). */
function u(s: string, decimals: number): bigint {
  const r = parseUnits(s, decimals);
  if (!r.ok) throw new Error(`bad fixture ${s}: ${r.error}`);
  return r.units;
}

// Live data from spec §3.2
const USDT = { decimals: 6, available: u('870.533207', 6), min: u('10', 6), fee: u('1.5', 6) };
const BTC = { decimals: 8, available: u('0.01246567', 8), min: u('0.0005', 8), fee: u('0.00002', 8) };
const ETH = {
  decimals: 18,
  available: u('12.365678901234591676', 18),
  min: u('0.01', 18),
  fee: u('0.0012', 18),
};

describe('validateClaimAmount', () => {
  it('passes parse errors through', () => {
    expect(validateClaimAmount({ ...USDT, input: '' })).toEqual({ ok: false, error: 'empty' });
    expect(validateClaimAmount({ ...USDT, input: '1e3' })).toEqual({ ok: false, error: 'format' });
    expect(validateClaimAmount({ ...BTC, input: '0.000500001' })).toEqual({
      ok: false,
      error: 'too_many_decimals',
    });
  });

  it('rejects an amount below the minimum', () => {
    expect(validateClaimAmount({ ...USDT, input: '9.999999' })).toEqual({ ok: false, error: 'below_min' });
  });

  it('rejects zero as below_min (like the server)', () => {
    expect(validateClaimAmount({ ...ETH, input: '0' })).toEqual({ ok: false, error: 'below_min' });
  });

  it('accepts exactly the minimum', () => {
    expect(validateClaimAmount({ ...BTC, input: '0.0005' })).toMatchObject({ ok: true, amount: 50000n });
  });

  it('accepts "0.0010" format but it is still checked against min', () => {
    expect(validateClaimAmount({ ...BTC, input: '0.0010' })).toMatchObject({ ok: true, amount: 100000n });
    expect(validateClaimAmount({ ...ETH, input: '0.0010' })).toEqual({ ok: false, error: 'below_min' });
  });

  it('accepts exactly the available balance (Max)', () => {
    const r = validateClaimAmount({ ...ETH, input: maxInput(ETH.available, ETH.decimals) });
    expect(r).toMatchObject({ ok: true, amount: ETH.available });
  });

  it('rejects available + 1 base unit', () => {
    const input = formatUnits(ETH.available + 1n, ETH.decimals); // 12.365678901234591677
    expect(input).toBe('12.365678901234591677');
    expect(validateClaimAmount({ ...ETH, input })).toEqual({ ok: false, error: 'above_available' });
  });

  it('rejects an amount equal to the fee (nothing would be received)', () => {
    // min ≤ fee here so the fee rule is the one that triggers
    const r = validateClaimAmount({ decimals: 6, available: u('100', 6), min: u('1', 6), fee: u('1.5', 6), input: '1.5' });
    expect(r).toEqual({ ok: false, error: 'fee_exceeds_amount' });
  });

  it('makes Max invalid when available < min', () => {
    const available = u('0.0004', 8);
    const r = validateClaimAmount({ ...BTC, available, input: maxInput(available, 8) });
    expect(r).toEqual({ ok: false, error: 'below_min' });
  });

  it('checks min before available (server order)', () => {
    const r = validateClaimAmount({ ...BTC, available: u('0.0001', 8), input: '0.0002' });
    expect(r).toEqual({ ok: false, error: 'below_min' });
  });
});

describe('fee and receive amount', () => {
  it('10 USDT − 1.5 fee = 8.5 USDT', () => {
    const r = validateClaimAmount({ ...USDT, input: '10' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(formatUnits(r.fee, 6)).toBe('1.5');
      expect(formatUnits(r.receive, 6)).toBe('8.5');
    }
  });

  it('0.0005 BTC − 0.00002 fee = 0.00048 BTC', () => {
    const r = validateClaimAmount({ ...BTC, input: '0.0005' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(formatUnits(r.receive, 8)).toBe('0.00048');
  });

  it('ETH Max with 18 decimals: 12.365678901234591676 − 0.0012 = 12.364478901234591676', () => {
    const r = validateClaimAmount({ ...ETH, input: '12.365678901234591676' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(formatUnits(r.receive, 18)).toBe('12.364478901234591676');
  });
});

describe('maxInput', () => {
  it('is the exact canonical available amount', () => {
    expect(maxInput(USDT.available, 6)).toBe('870.533207');
    expect(maxInput(ETH.available, 18)).toBe('12.365678901234591676');
    expect(maxInput(u('10', 6), 6)).toBe('10');
    expect(maxInput(0n, 8)).toBe('0');
  });
});
