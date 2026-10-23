/// <reference types="jest" />
import { DECIMAL_RE, formatUnits, normalizeInput, parseUnits } from '../decimal';

describe('parseUnits (mirrors the server format rules)', () => {
  it.each([
    ['0.5', 6, 500000n],
    ['12', 6, 12000000n],
    ['0', 6, 0n],
    ['0.0010', 8, 100000n], // trailing zeros are accepted, as long as they fit the decimals
    ['10.000000', 6, 10000000n], // exactly `decimals` digits, all zeros
  ])('accepts %p with %p decimals → %p', (input, decimals, units) => {
    expect(parseUnits(input, decimals)).toEqual({ ok: true, units });
  });

  it('rejects the empty string as "empty"', () => {
    expect(parseUnits('', 6)).toEqual({ ok: false, error: 'empty' });
  });

  it.each(['.5', '1.', '05', '00', '1e-3', '-1', '+1', ' 1', '1 ', '1,5', 'abc', '1.2.3', '0x10'])(
    'rejects %p as "format"',
    (input) => {
      expect(parseUnits(input, 6)).toEqual({ ok: false, error: 'format' });
    },
  );

  it('rejects BTC with 9 decimal places (BTC has 8)', () => {
    expect(parseUnits('0.000000001', 8)).toEqual({ ok: false, error: 'too_many_decimals' });
  });

  it('rejects USDT with 7 decimal places (USDT has 6)', () => {
    expect(parseUnits('1.1234567', 6)).toEqual({ ok: false, error: 'too_many_decimals' });
  });

  it('counts trailing zeros towards the decimal limit, like the server', () => {
    expect(parseUnits('1.0000000', 6)).toEqual({ ok: false, error: 'too_many_decimals' });
  });

  it('round-trips the ETH 18-decimal balance exactly', () => {
    const s = '12.365678901234591676';
    const parsed = parseUnits(s, 18);
    expect(parsed).toEqual({ ok: true, units: 12365678901234591676n });
    if (parsed.ok) expect(formatUnits(parsed.units, 18)).toBe(s);
  });

  it('handles huge integers without precision loss', () => {
    const s = '123456789012345678901234567890';
    const parsed = parseUnits(s, 18);
    expect(parsed).toEqual({ ok: true, units: 123456789012345678901234567890n * 10n ** 18n });
    if (parsed.ok) expect(formatUnits(parsed.units, 18)).toBe(s);
  });

  it('works for a 0-decimal asset', () => {
    expect(parseUnits('42', 0)).toEqual({ ok: true, units: 42n });
    expect(parseUnits('42.0', 0)).toEqual({ ok: false, error: 'too_many_decimals' });
  });
});

describe('normalizeInput (UI leniency, applied before parseUnits)', () => {
  it('trims whitespace', () => {
    expect(normalizeInput('  1.5 \n')).toBe('1.5');
    expect(parseUnits(normalizeInput(' 1'), 6)).toEqual({ ok: true, units: 1000000n });
  });

  it("turns ',' into '.' so '1,5' parses after normalizing", () => {
    expect(normalizeInput('1,5')).toBe('1.5');
    expect(parseUnits(normalizeInput('1,5'), 6)).toEqual({ ok: true, units: 1500000n });
  });

  it('does not make thousands separators valid', () => {
    expect(parseUnits(normalizeInput('1,000,5'), 6)).toEqual({ ok: false, error: 'format' });
  });
});

describe('formatUnits (canonical string)', () => {
  it.each([
    [1500000n, 6, '1.5'],
    [0n, 6, '0'],
    [0n, 0, '0'],
    [1n, 18, '0.000000000000000001'],
    [10000000n, 6, '10'], // no trailing dot or zeros
    [870533207n, 6, '870.533207'],
    [1246567n, 8, '0.01246567'],
    [42n, 0, '42'],
    [-1500000n, 6, '-1.5'],
    [-1n, 8, '-0.00000001'],
  ])('formats %p with %p decimals as %p', (units, decimals, expected) => {
    expect(formatUnits(units, decimals)).toBe(expected);
  });

  it('always produces a string the server format accepts (non-negative)', () => {
    for (const u of [0n, 1n, 100n, 123456789n, 10n ** 30n]) {
      expect(formatUnits(u, 8)).toMatch(DECIMAL_RE);
    }
  });
});
