import { Injectable, InjectionToken, inject } from '@angular/core';
import { type LogLevel, LOG_LEVELS } from '@core/config/app-config.model';
import { ConfigService } from '@core/config/config.service';

export type LogMethodLevel = Exclude<LogLevel, 'off'>;

/** Where log entries go. Add a remote sink (Sentry, Datadog, …) by providing another one. */
export interface LogSink {
  write(level: LogMethodLevel, message: string, context: readonly unknown[]): void;
}

export const consoleSink: LogSink = {
  write(level, message, context) {
    // Logging to the console is this sink's whole purpose.
    // eslint-disable-next-line no-console
    console[level](message, ...context);
  },
};

export const LOG_SINKS = new InjectionToken<readonly LogSink[]>('LOG_SINKS', {
  factory: () => [consoleSink],
});

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly config = inject(ConfigService);
  private readonly sinks = inject(LOG_SINKS);

  debug(message: string, ...context: unknown[]): void {
    this.write('debug', message, context);
  }

  info(message: string, ...context: unknown[]): void {
    this.write('info', message, context);
  }

  warn(message: string, ...context: unknown[]): void {
    this.write('warn', message, context);
  }

  error(message: string, ...context: unknown[]): void {
    this.write('error', message, context);
  }

  private write(level: LogMethodLevel, message: string, context: readonly unknown[]): void {
    // Before config loads (e.g. a bootstrap failure) log everything rather than nothing.
    const threshold = this.config.config()?.logLevel ?? 'debug';
    if (LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(threshold)) return;
    for (const sink of this.sinks) sink.write(level, message, context);
  }
}
