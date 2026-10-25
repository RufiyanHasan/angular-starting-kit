import { Pipe, type PipeTransform, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

export type DateStyle = 'short' | 'medium' | 'long';

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(lang: string, style: DateStyle): Intl.DateTimeFormat {
  const key = `${lang}|${style}`;
  let f = formatters.get(key);
  if (!f) formatters.set(key, (f = new Intl.DateTimeFormat(lang, { dateStyle: style })));
  return f;
}

/**
 * Formats a date in the active UI language with the built-in Intl API, so no Angular locale
 * data has to be registered per language. `{{ user.createdAt | localDate }}` → "Jan 4, 2025"
 * in English, "4 ene 2025" in Spanish. Impure so it follows language switches; formatters
 * are cached, so each call is cheap.
 */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  transform(value: string | number | Date | null | undefined, style: DateStyle = 'medium'): string {
    if (value === null || value === undefined || value === '') return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : formatter(this.lang(), style).format(date);
  }
}
