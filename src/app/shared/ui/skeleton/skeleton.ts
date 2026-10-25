import { Component, input } from '@angular/core';

/**
 * Placeholder shape shown while content loads. Hidden from assistive tech: announce loading
 * once on the container instead (`aria-busy="true"` or a visually hidden "Loading…").
 */
@Component({
  selector: 'app-skeleton',
  template: '',
  styles: `
    :host {
      display: block;
      width: var(--w);
      height: var(--h);
      border-radius: var(--radius-sm);
      background: linear-gradient(
          90deg,
          transparent,
          color-mix(in srgb, var(--color-surface) 60%, transparent),
          transparent
        )
        var(--color-surface-2);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    :host([data-shape='circle']) {
      border-radius: var(--radius-full);
    }
    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
    '[style.--w]': 'width()',
    '[style.--h]': 'height()',
  },
})
export class Skeleton {
  readonly width = input('100%');
  readonly height = input('1em');
  readonly shape = input<'rect' | 'circle'>('rect');
}
