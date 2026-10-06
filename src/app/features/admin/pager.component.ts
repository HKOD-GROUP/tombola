import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-pager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (total() > 0) {
      <nav class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600" aria-label="Pagination">
        <span>{{ from() }}–{{ to() }} sur {{ total().toLocaleString('fr-FR') }}</span>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary btn-sm" [disabled]="page() === 0" (click)="pageChange.emit(page() - 1)">Précédent</button>
          <button type="button" class="btn-secondary btn-sm" [disabled]="to() >= total()" (click)="pageChange.emit(page() + 1)">Suivant</button>
        </div>
      </nav>
    }
  `,
})
export class PagerComponent {
  readonly page = input(0);
  readonly size = input(25);
  readonly total = input(0);
  readonly pageChange = output<number>();
  readonly from = computed(() => this.page() * this.size() + 1);
  readonly to = computed(() => Math.min(this.total(), (this.page() + 1) * this.size()));
}
