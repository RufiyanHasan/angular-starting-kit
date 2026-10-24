import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { type AppConfig, parseAppConfig } from './app-config.model';

export const CONFIG_URL = 'assets/config.json';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  /** Bypasses interceptors: they depend on config, so config must load without them. */
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly state = signal<AppConfig | null>(null);

  /** Readonly view of the loaded config. Available to everything after bootstrap. */
  readonly config = this.state.asReadonly();

  async load(url = CONFIG_URL): Promise<void> {
    const raw = await firstValueFrom(this.http.get<unknown>(url));
    this.set(parseAppConfig(raw));
  }

  /** Replace the config. Used by `load()` and by `provideConfigForTesting()`. */
  set(config: AppConfig): void {
    this.state.set(config);
  }

  /** Typed accessor for code that runs after bootstrap (services, interceptors). */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    const config = this.state();
    if (!config) throw new Error(`ConfigService.get("${key}") called before config was loaded`);
    return config[key];
  }
}
