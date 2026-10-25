/**
 * Global unit-test setup (angular.json → test.options.setupFiles).
 * jsdom lacks a few browser APIs the app uses; minimal stand-ins live here.
 */

// <dialog>.showModal()/close(): jsdom has the element and its `open` attribute but no methods.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
