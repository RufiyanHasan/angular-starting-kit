import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let toast: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('auto-dismisses (errors last longer)', () => {
    toast.info('Saved draft');
    toast.error('Failed');
    vi.advanceTimersByTime(5000);
    expect(toast.toasts().map((t) => t.message)).toEqual(['Failed']);
    vi.advanceTimersByTime(3000);
    expect(toast.toasts()).toEqual([]);
  });

  it('keeps sticky toasts until dismissed', () => {
    const id = toast.warning('Read me', 0);
    vi.advanceTimersByTime(60_000);
    expect(toast.toasts()).toHaveLength(1);
    toast.dismiss(id);
    expect(toast.toasts()).toHaveLength(0);
  });

  it('de-duplicates identical visible toasts', () => {
    const a = toast.error('Server down');
    const b = toast.error('Server down');
    expect(a).toBe(b);
    expect(toast.toasts()).toHaveLength(1);
  });

  it('keeps at most five, dropping the oldest', () => {
    for (let i = 1; i <= 7; i++) toast.success(`#${i}`);
    expect(toast.toasts().map((t) => t.message)).toEqual(['#3', '#4', '#5', '#6', '#7']);
  });
});
