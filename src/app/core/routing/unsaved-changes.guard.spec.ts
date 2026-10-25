import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';
import { type HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const run = (component: HasUnsavedChanges) =>
    TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  it('allows leaving a clean page without asking', () => {
    const confirm = vi.spyOn(TestBed.inject(ConfirmService), 'confirm');
    expect(run({ hasUnsavedChanges: () => false })).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks (translated, destructive) when there are unsaved changes', async () => {
    const confirm = vi.spyOn(TestBed.inject(ConfirmService), 'confirm').mockResolvedValue(false);
    await expect(run({ hasUnsavedChanges: () => true })).resolves.toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Discard changes?', danger: true }),
    );
  });
});
