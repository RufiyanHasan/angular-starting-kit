import {
  Component,
  Directive,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';

let nextId = 0;

/**
 * Label + control + hint + error, wired for screen readers: the label targets the control,
 * and the control's aria-describedby / aria-invalid follow the hint and error automatically.
 * Pass an already-translated `error` (empty or null = valid).
 *
 *   <app-form-field label="Email" [error]="emailError()">
 *     <input appInput type="email" formControlName="email" />
 *   </app-form-field>
 */
@Component({
  selector: 'app-form-field',
  template: `
    <label class="label" [for]="controlId()">
      {{ label() }}
      @if (required()) {
        <span class="required" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (hint()) {
      <p class="hint" [id]="hintId()">{{ hint() }}</p>
    }
    <p class="error" [id]="errorId()">{{ error() }}</p>
  `,
  styleUrl: './form-field.scss',
})
export class FormField {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string | null>();
  /** Shows a visual marker only; also put `required` on the control itself. */
  readonly required = input(false, { transform: booleanAttribute });

  private readonly control = contentChild(InputDirective);
  private readonly autoId = `field-${++nextId}`;

  readonly controlId = computed(() => this.control()?.id() || this.autoId);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);

  readonly invalid = computed(() => !!this.error());
  readonly describedBy = computed(
    () =>
      [this.hint() && this.hintId(), this.invalid() && this.errorId()].filter(Boolean).join(' ') ||
      null,
  );
}

/** Styles a native input/select/textarea and links it to the surrounding <app-form-field>. */
@Directive({
  selector: 'input[appInput], select[appInput], textarea[appInput]',
  host: {
    class: 'app-input',
    '[id]': 'field?.controlId() ?? id()',
    '[attr.aria-invalid]': 'field?.invalid() || null',
    '[attr.aria-describedby]': 'field?.describedBy()',
  },
})
export class InputDirective {
  protected readonly field = inject(FormField, { optional: true });
  readonly id = input('');
}
