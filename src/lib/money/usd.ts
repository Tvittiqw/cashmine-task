// Exact USD valuation: bigint math at full precision, rounded once (half-up to cents) for display.
import { DECIMAL_RE, groupThousands } from './decimal';

/** value = units / 10^scale */
export interface UsdValue {
  units: bigint;
  scale: number;
}

/** amount (base units) × usdPrice. Returns null for a missing/invalid price — never treat it as $0. */
export function toUsd(amount: bigint, decimals: number, usdPrice: string): UsdValue | null {
  const match = DECIMAL_RE.exec(usdPrice);
  if (!match) return null;
  const priceFrac = match[2] ? match[2].slice(1) : '';
  const priceUnits = BigInt(match[1] + priceFrac); // price × 10^priceFrac.length
  return { units: amount * priceUnits, scale: decimals + priceFrac.length };
}

/** Exact sum: every value is rescaled to the largest scale first. */
export function sumUsd(values: UsdValue[]): UsdValue {
  const scale = values.reduce((max, v) => Math.max(max, v.scale), 0);
  const units = values.reduce((sum, v) => sum + v.units * 10n ** BigInt(scale - v.scale), 0n);
  return { units, scale };
}

/** "$1,234.57" — rounds half-up (away from zero) to cents, once. */
export function formatUsd(v: UsdValue): string {
  const negative = v.units < 0n;
  const cents = roundToCents(negative ? -v.units : v.units, v.scale);
  const dollars = groupThousands((cents / 100n).toString());
  const rest = (cents % 100n).toString().padStart(2, '0');
  const sign = negative && cents > 0n ? '-' : '';
  return `${sign}$${dollars}.${rest}`;
}

/** Non-negative units at `scale` → whole cents, half-up. */
function roundToCents(units: bigint, scale: number): bigint {
  if (scale <= 2) return units * 10n ** BigInt(2 - scale);
  const divisor = 10n ** BigInt(scale - 2);
  return (units + divisor / 2n) / divisor;
}
