import { createUnsignedJwt, decodeJwt } from './jwt';

describe('jwt', () => {
  it('round-trips a payload, including non-ASCII claims', () => {
    const payload = { sub: 'u-1', iat: 1, exp: 2, name: 'José Ñandú' };
    expect(decodeJwt(createUnsignedJwt(payload))).toEqual(payload);
  });

  it.each(['', 'abc', 'a.b.c', 'a.' + btoa('{"sub":1}') + '.c'])('returns null for %j', (token) => {
    expect(decodeJwt(token)).toBeNull();
  });
});
