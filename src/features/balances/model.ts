import { ApiError } from '../../lib/api/apiClient';
import type { BalancesDto } from '../../lib/api/endpoints';
import { parseUnits, sumUsd, toUsd, type UsdValue } from '../../lib/money';

export interface Balance {
  asset: string;
  decimals: number;
  available: bigint;
  pending: bigint;
  claiming: bigint;
  usdPrice: string;
}

function units(value: string, decimals: number): bigint {
  const parsed = parseUnits(value, decimals);
  if (!parsed.ok) throw new ApiError('invalid_response', 'Unexpected balance amount from CashMine');
  return parsed.units;
}

export function toBalances(dto: BalancesDto): Balance[] {
  return dto.items.map((i) => ({
    asset: i.asset,
    decimals: i.decimals,
    available: units(i.available, i.decimals),
    pending: units(i.pending, i.decimals),
    claiming: units(i.claiming, i.decimals),
    usdPrice: i.usdPrice,
  }));
}

export interface UsdTotals {
  total: UsdValue;
  available: UsdValue;
  /** Assets left out because their price is missing or invalid — never counted as $0. */
  unpriced: string[];
}

/** D4: total = available + pending + claiming; "available to claim" = available only. */
export function usdTotals(balances: Balance[]): UsdTotals {
  const total: UsdValue[] = [];
  const available: UsdValue[] = [];
  const unpriced: string[] = [];
  for (const b of balances) {
    const all = toUsd(b.available + b.pending + b.claiming, b.decimals, b.usdPrice);
    const avail = toUsd(b.available, b.decimals, b.usdPrice);
    if (!all || !avail) {
      unpriced.push(b.asset);
      continue;
    }
    total.push(all);
    available.push(avail);
  }
  return { total: sumUsd(total), available: sumUsd(available), unpriced };
}
