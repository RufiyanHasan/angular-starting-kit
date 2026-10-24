import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err: unknown) => {
  console.error('Bootstrap failed', err);
  // Most likely a missing or invalid /assets/config.json. Show something better than a blank page.
  document.body.innerHTML = `
    <main style="font-family: system-ui, sans-serif; max-width: 36rem; margin: 4rem auto; padding: 0 1rem">
      <h1>The application failed to start</h1>
      <p>Please try again later. If the problem persists, contact support.</p>
    </main>`;
});
