import { Injectable } from '@angular/core';

const PREFIX = 'app.';

/**
 * JSON wrapper around localStorage that never throws: private mode, quota errors and
 * corrupted values all degrade to "nothing stored".
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage unavailable: the app keeps working, the value just isn't persisted.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // See set().
    }
  }
}
