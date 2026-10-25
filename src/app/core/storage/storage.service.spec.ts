import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(StorageService);
  });

  it('round-trips JSON values under a namespaced key', () => {
    storage.set('prefs', { theme: 'dark' });
    expect(storage.get('prefs')).toEqual({ theme: 'dark' });
    expect(localStorage.getItem('app.prefs')).toBe('{"theme":"dark"}');
  });

  it('returns null for missing or corrupted values', () => {
    expect(storage.get('missing')).toBeNull();
    localStorage.setItem('app.bad', '{not json');
    expect(storage.get('bad')).toBeNull();
  });

  it('removes values', () => {
    storage.set('k', 1);
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => storage.set('k', 1)).not.toThrow();
    spy.mockRestore();
  });
});
