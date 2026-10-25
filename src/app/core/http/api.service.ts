import { type HttpContext, HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ConfigService } from '@core/config/config.service';
import { type Observable } from 'rxjs';

type ParamValue = string | number | boolean;

export interface ApiRequestOptions {
  readonly params?: Readonly<Record<string, ParamValue | readonly ParamValue[] | null | undefined>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly context?: HttpContext;
}

/**
 * Thin typed wrapper over HttpClient that prefixes `config.json → apiBaseUrl` and drops
 * null/undefined params. Interceptors (auth, errors, loading, timeout) apply automatically.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  url(path: string): string {
    const base = this.config.get('apiBaseUrl').replace(/\/+$/, '');
    return `${base}/${path.replace(/^\/+/, '')}`;
  }

  get<T>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    return this.http.get<T>(this.url(path), toHttpOptions(options));
  }

  post<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http.post<T>(this.url(path), body, toHttpOptions(options));
  }

  put<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http.put<T>(this.url(path), body, toHttpOptions(options));
  }

  patch<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<T> {
    return this.http.patch<T>(this.url(path), body, toHttpOptions(options));
  }

  delete<T = void>(path: string, options: ApiRequestOptions = {}): Observable<T> {
    return this.http.delete<T>(this.url(path), toHttpOptions(options));
  }
}

function toHttpOptions({ params, headers, context }: ApiRequestOptions) {
  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === null || value === undefined || value === '') continue;
    const values: readonly ParamValue[] = Array.isArray(value) ? value : [value as ParamValue];
    for (const v of values) httpParams = httpParams.append(key, String(v));
  }
  return { params: httpParams, headers: { ...headers }, context };
}
