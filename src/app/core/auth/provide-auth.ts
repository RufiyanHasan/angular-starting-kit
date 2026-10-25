import { type Provider, type Type, inject } from '@angular/core';
import { type AppConfig } from '@core/config/app-config.model';
import { ConfigService } from '@core/config/config.service';
import { AuthProvider } from './auth-provider';
import { MockJwtAuthProvider } from './mock/mock-jwt-auth.provider';

type ProviderName = AppConfig['auth']['provider'];

/**
 * Maps `config.json → auth.provider` to an implementation. To add OIDC, implement
 * AuthProvider (see README → "Swapping the auth provider") and register it under `oidc`.
 */
const AUTH_PROVIDERS: Record<ProviderName, Type<AuthProvider> | null> = {
  mock: MockJwtAuthProvider,
  oidc: null,
};

export function provideAuth(): Provider[] {
  return [
    MockJwtAuthProvider,
    {
      provide: AuthProvider,
      useFactory: () => {
        const name = inject(ConfigService).get('auth').provider;
        const impl = AUTH_PROVIDERS[name];
        if (!impl) throw new Error(`Auth provider "${name}" is not registered in provide-auth.ts`);
        return inject(impl);
      },
    },
  ];
}
