/** True when `url` targets our API. Tokens must never be sent to third-party hosts. */
export function isApiUrl(url: string, apiBaseUrl: string): boolean {
  const base = apiBaseUrl.replace(/\/+$/, '');
  return url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`);
}
