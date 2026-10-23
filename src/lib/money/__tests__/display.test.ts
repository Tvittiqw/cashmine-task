import { formatAmountDisplay } from '../display';

describe('formatAmountDisplay (lists: truncate, never round up)', () => {
  it('truncates ETH to 8 fraction digits and strips the trailing zero: 12.365678901234591676 → "12.3656789"', () => {
    // First 8 fraction digits are "36567890"; the rest is cut off and the trailing 0 is dropped.
    expect(formatAmountDisplay(12365678901234591676n, 18)).toBe('12.3656789');
  });

  it('never rounds up: 0.999999999999999999 ETH → "0.99999999", not "1"', () => {
    expect(formatAmountDisplay(999999999999999999n, 18)).toBe('0.99999999');
  });

  it('shows short fractions exactly, without trailing zeros', () => {
    expect(formatAmountDisplay(870533207n, 6)).toBe('870.533207');
    expect(formatAmountDisplay(1246567n, 8)).toBe('0.01246567');
    expect(formatAmountDisplay(10000000n, 6)).toBe('10');
  });

  it('groups thousands with ","', () => {
    expect(formatAmountDisplay(1234567500000n, 6)).toBe('1,234,567.5');
    expect(formatAmountDisplay(1000n, 0)).toBe('1,000');
    expect(formatAmountDisplay(999n, 0)).toBe('999');
  });

  it('shows "0" for zero and for amounts below the display precision', () => {
    expect(formatAmountDisplay(0n, 18)).toBe('0');
    expect(formatAmountDisplay(1n, 18)).toBe('0'); // 1 wei, truncated
  });

  it('respects a custom maxFraction', () => {
    expect(formatAmountDisplay(12365678901234591676n, 18, 2)).toBe('12.36');
    expect(formatAmountDisplay(12365678901234591676n, 18, 18)).toBe('12.365678901234591676');
  });

  it('handles negatives (e.g. reversals) by truncating the magnitude', () => {
    expect(formatAmountDisplay(-1234567500000n, 6)).toBe('-1,234,567.5');
    expect(formatAmountDisplay(-999999999999999999n, 18)).toBe('-0.99999999');
    expect(formatAmountDisplay(-1n, 18)).toBe('0'); // no "-0"
  });
});
