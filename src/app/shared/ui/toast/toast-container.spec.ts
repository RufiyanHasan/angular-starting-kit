import { TestBed } from '@angular/core/testing';
import { ToastContainer } from './toast-container';
import { ToastService } from './toast.service';

describe('ToastContainer', () => {
  it('renders errors in the assertive region and others in the polite one; dismiss works', async () => {
    const fixture = TestBed.createComponent(ToastContainer);
    const toast = TestBed.inject(ToastService);
    const el = fixture.nativeElement as HTMLElement;

    toast.error('Boom', 0);
    toast.success('Saved', 0);
    await fixture.whenStable();

    expect(el.querySelector('[aria-live="assertive"]')?.textContent).toContain('Boom');
    expect(el.querySelector('[aria-live="polite"]')?.textContent).toContain('Saved');

    el.querySelector<HTMLButtonElement>('[aria-label="Dismiss notification"]')!.click();
    await fixture.whenStable();
    expect(el.textContent).not.toContain('Boom');
  });
});
