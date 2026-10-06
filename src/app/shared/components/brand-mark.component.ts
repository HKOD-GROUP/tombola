import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SITE_NAME } from '../../core/services/seo.service';

/** Logo provisoire : wordmark « TOMBOLA » en Mona Sans 800 italique. */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="block font-display font-extrabold uppercase italic leading-none tracking-[-0.01em]"
    [style.font-size.px]="size()"
    >{{ name }}</span
  >`,
  host: { class: 'inline-block' },
})
export class BrandMarkComponent {
  /** Taille de police du wordmark (px). */
  readonly size = input(24);
  readonly name = SITE_NAME;
}
