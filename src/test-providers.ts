import { provideI18nForTesting } from '@core/i18n/testing';

/**
 * Providers added to every TestBed (angular.json → test.options.providersFile).
 * Translations are global because nearly every component template uses them.
 */
export default [provideI18nForTesting()];
