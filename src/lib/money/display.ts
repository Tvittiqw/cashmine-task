// Compact display for lists: truncates (never rounds up) and groups thousands.
import { groupThousands } from './decimal';

/**
 * Formats base units with at most `maxFraction` fraction digits, cut off (not rounded), so a
 * shown balance is never more than the real one. Trailing zeros are stripped.
 * e.g. ETH 12.365678901234591676 → "12.3656789"; 1234567.5 → "1,234,567.5".
 */
export function formatAmountDisplay(units: bigint, decimals: number, maxFraction = 8): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const base = 10n ** BigInt(decimals);
  const intPart = groupThousands((abs / base).toString());
  const fracPart = (abs % base)
    .toString()
    .padStart(decimals, '0')
    .slice(0, maxFraction)
    .replace(/0+$/, '');
  // Avoid "-0" when a tiny negative amount truncates to zero.
  const sign = negative && (abs / base > 0n || fracPart !== '') ? '-' : '';
  return sign + (fracPart ? `${intPart}.${fracPart}` : intPart);
}
