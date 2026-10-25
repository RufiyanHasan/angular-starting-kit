import { type ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { MOCK_BACKEND } from '@core/http/mock-backend';
import { provideCore } from '@core/provide-core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCore(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Lazy: the mock API (MSW + handlers) is only downloaded when config.json has mockApi: true.
    {
      provide: MOCK_BACKEND,
      useValue: (apiBaseUrl: string) =>
        import('../mocks/browser').then((m) => m.startMockApi(apiBaseUrl)),
    },
  ],
};
