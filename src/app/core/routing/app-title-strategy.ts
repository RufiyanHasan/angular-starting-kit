import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ConfigService } from '@core/config/config.service';

/** Renders route `title`s as "Page · App name". */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly config = inject(ConfigService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const appName = this.config.get('appName');
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · ${appName}` : appName);
  }
}
