import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { TranslocoService, getBrowserLang } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { LoggerService } from '../logging/logger.service';
import { StorageService } from '../storage/storage.service';

const STORAGE_KEY = 'lang';

/**
 * Owns the active language: picks it at startup (saved choice → browser language → config
 * default), persists changes and keeps `<html lang>` in sync. Always loads a language's file
 * *before* activating it, so the UI never flashes untranslated keys.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly config = inject(ConfigService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly document = inject(DOCUMENT);

  private readonly current = signal('en');
  private readonly langs = signal<readonly string[]>(['en']);

  readonly lang = this.current.asReadonly();
  readonly available = this.langs.asReadonly();

  /** Called once by provideCore's initializer, after config has loaded. */
  async init(): Promise<void> {
    const { defaultLang, availableLangs } = this.config.get('i18n');
    this.langs.set(availableLangs);
    this.transloco.setAvailableLangs([...availableLangs]);
    this.transloco.setDefaultLang(defaultLang);

    const preferred = [this.storage.get<string>(STORAGE_KEY), getBrowserLang()].find(
      (lang): lang is string => !!lang && availableLangs.includes(lang),
    );
    try {
      await this.activate(preferred ?? defaultLang);
    } catch (error) {
      if (preferred === undefined || preferred === defaultLang) throw error;
      this.logger.warn(`Could not load language "${preferred}", using "${defaultLang}"`, error);
      await this.activate(defaultLang);
    }
  }

  /** Switches language and remembers the choice. Unknown languages are ignored. */
  async use(lang: string): Promise<void> {
    if (!this.langs().includes(lang) || lang === this.current()) return;
    await this.activate(lang);
    this.storage.set(STORAGE_KEY, lang);
  }

  /** The language's name in its own language ("English", "español"). */
  displayName(lang: string): string {
    try {
      return new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang;
    } catch {
      return lang;
    }
  }

  private async activate(lang: string): Promise<void> {
    await firstValueFrom(this.transloco.load(lang));
    this.transloco.setActiveLang(lang);
    this.current.set(lang);
    this.document.documentElement.lang = lang;
  }
}
