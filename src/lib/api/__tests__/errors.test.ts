import {
  ApiError,
  isDefinitiveClaimRejection,
  isRetryableRead,
  isUnauthorized,
  userMessage,
} from '../apiClient';

const http = (status: number, code?: string, message = 'server message') =>
  new ApiError('http', message, { status, code });

describe('ApiError', () => {
  it('is an Error with a working prototype', () => {
    const e = http(400);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ApiError');
  });
});

describe('classifiers', () => {
  it.each([
    ['http 400', http(400), { claimRejected: true, retryRead: false }],
    ['http 401', http(401), { claimRejected: true, retryRead: false }],
    ['http 404', http(404), { claimRejected: false, retryRead: false }],
    ['http 409', http(409), { claimRejected: true, retryRead: false }],
    ['http 429', http(429), { claimRejected: false, retryRead: true }],
    ['http 500', http(500), { claimRejected: false, retryRead: true }],
    ['http 502', http(502), { claimRejected: false, retryRead: true }],
    ['http 503', http(503), { claimRejected: false, retryRead: true }],
    ['http 504', http(504), { claimRejected: false, retryRead: true }],
    ['network', new ApiError('network', 'x'), { claimRejected: false, retryRead: true }],
    ['timeout', new ApiError('timeout', 'x'), { claimRejected: false, retryRead: true }],
    ['invalid_response', new ApiError('invalid_response', 'x', { status: 201 }), { claimRejected: false, retryRead: false }],
    ['plain Error', new Error('x'), { claimRejected: false, retryRead: false }],
  ])('%s', (_name, e, expected) => {
    expect(isDefinitiveClaimRejection(e)).toBe(expected.claimRejected);
    expect(isRetryableRead(e)).toBe(expected.retryRead);
  });

  it('isUnauthorized only for http 401', () => {
    expect(isUnauthorized(http(401))).toBe(true);
    expect(isUnauthorized(http(403))).toBe(false);
    expect(isUnauthorized(new ApiError('network', 'x'))).toBe(false);
  });
});

describe('userMessage', () => {
  it('maps errors to friendly copy', () => {
    expect(userMessage(http(400, 'VALIDATION', 'The minimum claim is 0.01 ETH'))).toBe('The minimum claim is 0.01 ETH');
    expect(userMessage(http(401))).toBe('Your token was rejected or has expired.');
    expect(userMessage(http(429))).toBe('Too many requests. Please wait a moment and try again.');
    expect(userMessage(new ApiError('network', 'x'))).toBe("Can't reach CashMine. Check your connection.");
    expect(userMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});
