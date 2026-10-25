import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, InputDirective } from './form-field';

@Component({
  imports: [FormField, InputDirective],
  template: `
    <app-form-field label="Email" hint="Work address" [error]="error()" required>
      <input appInput id="email" />
    </app-form-field>
    <app-form-field label="Name"><input appInput /></app-form-field>
  `,
})
class Host {
  readonly error = signal<string | null>(null);
}

describe('FormField', () => {
  it('links label, hint and error to the control', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#email')!;

    expect(el.querySelector('label')?.getAttribute('for')).toBe('email');
    expect(input.getAttribute('aria-describedby')).toBe('email-hint');
    expect(input.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.error.set('Email is required.');
    await fixture.whenStable();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-hint email-error');
    expect(el.querySelector('#email-error')?.textContent).toContain('Email is required.');
  });

  it('generates an id when the control has none', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [, label] = (fixture.nativeElement as HTMLElement).querySelectorAll('label');
    const input = (fixture.nativeElement as HTMLElement).querySelectorAll('input')[1]!;
    expect(input.id).toMatch(/^field-\d+$/);
    expect(label?.getAttribute('for')).toBe(input.id);
  });
});
