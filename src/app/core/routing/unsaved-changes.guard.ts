import { inject } from '@angular/core';
import { type CanDeactivateFn } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { ConfirmService } from '@shared/ui/confirm-dialog/confirm.service';

/** Implement on a routed component that holds a form. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Asks before leaving a page with unsaved edits: `canDeactivate: [unsavedChangesGuard]`.
 * (Closing the tab is not covered; add a `beforeunload` listener if a form needs that.)
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  const t = inject(TranslocoService);
  return inject(ConfirmService).confirm({
    title: t.translate('ui.unsaved.title'),
    message: t.translate('ui.unsaved.message'),
    confirmLabel: t.translate('ui.unsaved.confirm'),
    cancelLabel: t.translate('ui.unsaved.cancel'),
    danger: true,
  });
};
