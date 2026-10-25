import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ConfigService } from '@core/config/config.service';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Renders route `title`s as "Page · App name". Titles are translation keys
 * (`title: 'titles.users'`) and the document title follows language changes.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly config = inject(ConfigService);
  private readonly transloco = inject(TranslocoService);
  private snapshot: RouterStateSnapshot | null = null;

  constructor() {
    super();
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.snapshot && this.updateTitle(this.snapshot));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.snapshot = snapshot;
    const appName = this.config.get('appName');
    const key = this.buildTitle(snapshot);
    this.title.setTitle(key ? `${this.transloco.translate(key)} · ${appName}` : appName);
  }
}
