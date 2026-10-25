import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';
import { ConfirmService } from './confirm.service';

describe('ConfirmDialog', () => {
  async function setup() {
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('dialog')!;
    const buttons = () => [...dialog.querySelectorAll<HTMLButtonElement>('.footer button')];
    return { fixture, el, dialog, buttons, confirm: TestBed.inject(ConfirmService) };
  }

  it('opens a modal and resolves true on confirm', async () => {
    const { fixture, dialog, buttons, confirm } = await setup();
    expect(dialog.open).toBe(false);

    const result = confirm.confirm({ title: 'Delete user?', message: 'Ada', danger: true });
    await fixture.whenStable();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe(dialog.querySelector('h2')?.id);
    expect(dialog.textContent).toContain('Delete user?');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Confirm']);
    expect(buttons()[1]?.getAttribute('data-variant')).toBe('danger');
    expect(document.activeElement).toBe(buttons()[0]); // safe default

    buttons()[1]!.click();
    await expect(result).resolves.toBe(true);
    await fixture.whenStable();
    expect(dialog.open).toBe(false);
  });

  it('resolves false on cancel, Escape/close and when replaced by a newer request', async () => {
    const { fixture, dialog, buttons, confirm } = await setup();

    const cancelled = confirm.confirm({ title: 'A', message: '' });
    await fixture.whenStable();
    buttons()[0]!.click();
    await expect(cancelled).resolves.toBe(false);

    const closed = confirm.confirm({ title: 'B', message: '' });
    await fixture.whenStable();
    dialog.close(); // what the browser does on Escape
    await expect(closed).resolves.toBe(false);

    const first = confirm.confirm({ title: 'C', message: '' });
    const second = confirm.confirm({ title: 'D', message: '', confirmLabel: 'Yes' });
    await expect(first).resolves.toBe(false);
    await fixture.whenStable();
    expect(buttons()[1]?.textContent).toContain('Yes');
    confirm.settle(true);
    await expect(second).resolves.toBe(true);
  });

  it('returns focus to the opener when closed', async () => {
    const { fixture, buttons, confirm } = await setup();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    void confirm.confirm({ title: 'A', message: '' });
    await fixture.whenStable();
    buttons()[0]!.click();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
