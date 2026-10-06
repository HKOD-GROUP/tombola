import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { isPlaceholder } from '../../core/utils/format';

/**
 * Affiche une valeur administrable, ou un badge « À compléter » quand elle est
 * vide / encore provisoire (seed du back : « À compléter »).
 */
@Component({
  selector: 'app-todo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (missing()) {
      <span class="badge-todo align-middle" [attr.title]="hint() || null">À compléter</span>
    } @else {
      <span [class.whitespace-pre-line]="multiline()">{{ value() }}</span>
    }
  `,
})
export class TodoComponent {
  readonly value = input<string | null | undefined>(null);
  readonly hint = input('');
  readonly multiline = input(false);
  readonly missing = computed(() => isPlaceholder(this.value()));
}
