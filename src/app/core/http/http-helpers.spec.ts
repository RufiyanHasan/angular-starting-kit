import { HttpErrorResponse } from '@angular/common/http';
import { httpErrorMessage } from './http-error-message';
import { isApiUrl } from './is-api-url';

describe('isApiUrl', () => {
  it.each([
    ['/api/users', '/api', true],
    ['/api', '/api/', true],
    ['/api?x=1', '/api', true],
    ['/apix/users', '/api', false],
    ['https://evil.com/api/users', '/api', false],
    ['https://api.example.com/v1/users', 'https://api.example.com/v1', true],
    ['https://api.example.com.evil.com/v1', 'https://api.example.com', false],
  ])('%s with base %s → %s', (url, base, expected) => {
    expect(isApiUrl(url, base)).toBe(expected);
  });
});

describe('httpErrorMessage', () => {
  const err = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

  it.each([
    [0, 'errors.http.network'],
    [408, 'errors.http.timeout'],
    [403, 'errors.http.forbidden'],
    [404, 'errors.http.notFound'],
    [400, 'errors.http.badRequest'],
    [503, 'errors.http.server'],
  ])('%d → %s', (status, key) => {
    expect(httpErrorMessage(err(status))).toBe(key);
  });

  it('uses the server message for 4xx but never for 5xx', () => {
    expect(httpErrorMessage(err(422, { message: 'Name is required.' }))).toBe('Name is required.');
    expect(httpErrorMessage(err(500, { message: 'NullPointerException at …' }))).toBe(
      'errors.http.server',
    );
  });

  it('translates keys with the given function', () => {
    expect(httpErrorMessage(err(0), (key) => `<${key}>`)).toBe('<errors.http.network>');
  });
});
