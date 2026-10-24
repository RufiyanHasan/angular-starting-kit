import { Component, inject } from '@angular/core';
import { ConfigService } from '@core/config/config.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly config = inject(ConfigService).config;
}
