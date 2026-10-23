/// <reference types="jest" />
import type { ClaimOptionsDto } from '../../../lib/api/endpoints';
import { checkClaim, CLAIM_AMOUNT_ERROR_MESSAGE } from '../claimValidation';

const options: ClaimOptionsDto = { asset: 'USDT', minAmount: '10', fee: '1.5', destinations: [] };
const balance = { decimals: 6, available: 870_533_207n }; // 870.533207

describe('checkClaim', () => {
  it('accepts a valid amount and computes what you receive', () => {
    const c = checkClaim('10', balance, options);
    expect(c.result).toEqual({ ok: true, amount: 10_000_000n, fee: 1_500_000n, receive: 8_500_000n });
    expect(c.canMax).toBe(true);
  });

  it('applies the comma leniency before validating', () => {
    expect(checkClaim(' 12,5 ', balance, options).result).toMatchObject({ ok: true, amount: 12_500_000n });
  });

  it('rejects a thousands separator instead of reading it as a decimal point', () => {
    expect(checkClaim('1,000,5', balance, options).result).toEqual({ ok: false, error: 'format' });
  });

  it('turns Max off when the whole balance is below the minimum', () => {
    expect(checkClaim('', { decimals: 6, available: 9_999_999n }, options).canMax).toBe(false);
  });

  it('flags server options that do not fit the asset precision', () => {
    const c = checkClaim('10', { decimals: 2, available: 100_000n }, { ...options, fee: '1.555' });
    expect(c).toEqual({ optionsBroken: true, canMax: false, result: null });
  });
});

describe('CLAIM_AMOUNT_ERROR_MESSAGE', () => {
  const ctx = { asset: 'ETH', decimals: 18, minAmount: '0.01', fee: '0.0012', available: '12.3' };
  it.each([
    ['below_min', 'The minimum claim is 0.01 ETH.'],
    ['above_available', 'You have 12.3 ETH available.'],
    ['too_many_decimals', 'ETH allows up to 18 decimal places.'],
  ] as const)('%s', (error, text) => {
    expect(CLAIM_AMOUNT_ERROR_MESSAGE[error](ctx)).toBe(text);
  });
});
