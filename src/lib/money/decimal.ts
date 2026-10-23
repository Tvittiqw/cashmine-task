// Exact decimal <-> bigint base-unit conversion. Mirrors the server's amount rules (spec §3.3).

/** Server-equivalent amount format: no sign, no exponent, no leading zeros, no bare dot. */
export const DECIMAL_RE = /^(0|[1-9]\d*)(\.\d+)?$/;

export type ParseError = 'empty' | 'format' | 'too_many_decimals';

/** Input leniency for the amount field (D8): trim whitespace, accept ',' as the decimal separator. */
export function normalizeInput(raw: string): string {
  return raw.trim().replace(/,/g, '.');
}

/**
 * Parses a decimal string into base units (amount × 10^decimals).
 * Strict: no trimming or normalizing here, so it rejects exactly what the server rejects.
 */
export function parseUnits(
  s: string,
  decimals: number,
): { ok: true; units: bigint } | { ok: false; error: ParseError } {
  if (s === '') return { ok: false, error: 'empty' };
  const match = DECIMAL_RE.exec(s);
  if (!match) return { ok: false, error: 'format' };

  const intPart = match[1];
  const fracPart = match[2] ? match[2].slice(1) : ''; // drop the '.'
  // Counts trailing zeros too, like the server ("1.000" is 3 decimals).
  if (fracPart.length > decimals) return { ok: false, error: 'too_many_decimals' };

  // Right-pad the fraction to `decimals` digits, then the whole string is the unit count.
  const units = BigInt(intPart + fracPart.padEnd(decimals, '0'));
  return { ok: true, units };
}

/** Canonical decimal string: no trailing zeros, no trailing dot, 0n → "0", negatives prefixed '-'. */
export function formatUnits(units: bigint, decimals: number): string {
  if (units < 0n) return '-' + formatUnits(-units, decimals);
  const base = 10n ** BigInt(decimals);
  const intPart = (units / base).toString();
  const fracPart = (units % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** Inserts ',' every three digits of a string of digits ("1234567" → "1,234,567"). */
export function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
