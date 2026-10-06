import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Download, LucideAngularModule, Search } from 'lucide-angular';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminOrderSummary, Page } from '../../core/models/tombola.models';
import { AdminApiService, filenameFrom, saveBlob } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatDateTimeShort, formatEuros } from '../../core/utils/format';
import { ORDER_STATUS_BADGES, ORDER_STATUS_LABELS, SHIPPING_LABELS } from './admin-ui';
import { PagerComponent } from './pager.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule, PagerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1>Commandes</h1>
      <button type="button" class="btn-secondary btn-sm" (click)="exportShipping()" [disabled]="exporting()">
        <lucide-icon [img]="icDownload" [size]="16" aria-hidden="true" /> Export préparation (CSV)
      </button>
    </div>

    <div class="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_180px_180px]">
      <div class="relative">
        <label class="sr-only" for="q">Rechercher</label>
        <lucide-icon [img]="icSearch" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        <input id="q" class="input pl-9" placeholder="Référence, nom, e-mail, n° de participation" [ngModel]="q()" (ngModelChange)="search$.next($event)" />
      </div>
      <div>
        <label class="sr-only" for="status">Statut</label>
        <select id="status" class="input" [ngModel]="status()" (ngModelChange)="status.set($event); reload()">
          <option value="">Tous les statuts</option>
          @for (s of statuses; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
      </div>
      <div>
        <label class="sr-only" for="shipping">Expédition</label>
        <select id="shipping" class="input" [ngModel]="shipping()" (ngModelChange)="shipping.set($event); reload()">
          <option value="">Toutes expéditions</option>
          <option value="TO_SHIP">À expédier</option>
          <option value="SHIPPED">Expédiées</option>
        </select>
      </div>
    </div>

    @if (error()) {
      <p class="alert-error mb-4" role="alert">{{ error() }}</p>
    }

    <div class="card overflow-x-auto">
      <table class="table-admin min-w-[760px]">
        <thead>
          <tr><th>Référence</th><th>Date</th><th>Client</th><th>Packs</th><th class="text-right">Total</th><th>Statut</th><th>Expédition</th></tr>
        </thead>
        <tbody>
          @for (o of result()?.items ?? []; track o.id) {
            <tr>
              <td><a [routerLink]="['/admin/commandes', o.id]" class="font-mono font-semibold">{{ o.reference }}</a></td>
              <td class="whitespace-nowrap">{{ date(o.createdAt) }}</td>
              <td>{{ o.firstName }} {{ o.lastName }}<br /><span class="text-xs text-ink-500">{{ o.email }}</span></td>
              <td class="text-ink-600">{{ o.packsSummary }}<br /><span class="text-xs text-ink-500">{{ o.chances }} participation(s)</span></td>
              <td class="text-right tabular-nums">{{ euros(o.totalCents) }}</td>
              <td><span [class]="statusBadges[o.status]">{{ statusLabels[o.status] }}</span></td>
              <td>
                @if (o.status === 'PAID' && o.shippingStatus) {
                  <span [class]="o.shippingStatus === 'SHIPPED' ? 'badge-go' : 'badge-todo'">{{ shippingLabels[o.shippingStatus] }}</span>
                } @else { <span class="text-ink-300">—</span> }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="py-8 text-center text-ink-500">{{ loading() ? 'Chargement…' : 'Aucune commande.' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
    <app-pager [page]="page()" [size]="size" [total]="result()?.total ?? 0" (pageChange)="page.set($event); load()" />
  `,
})
export class AdminOrdersComponent {
  /** `?expedition=TO_SHIP` depuis le tableau de bord. */
  readonly expedition = input<string | undefined>(undefined);
  private readonly api = inject(AdminApiService);

  readonly icSearch = Search;
  readonly icDownload = Download;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusBadges = ORDER_STATUS_BADGES;
  readonly shippingLabels = SHIPPING_LABELS;
  readonly statuses = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }));
  readonly euros = (c: number) => formatEuros(c);
  readonly date = formatDateTimeShort;

  readonly size = 25;
  readonly q = signal('');
  readonly status = signal('');
  readonly shipping = signal('');
  readonly page = signal(0);
  readonly result = signal<Page<AdminOrderSummary> | null>(null);
  readonly loading = signal(false);
  readonly exporting = signal(false);
  readonly error = signal<string | null>(null);
  readonly search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((q) => {
      this.q.set(q);
      this.reload();
    });
    queueMicrotask(() => {
      if (this.expedition()) {
        this.shipping.set(this.expedition()!);
        this.status.set('PAID');
      }
      this.load();
    });
  }

  reload(): void {
    this.page.set(0);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .orders({ status: this.status(), shippingStatus: this.shipping(), q: this.q().trim(), page: this.page(), size: this.size })
      .subscribe({
        next: (r) => {
          this.result.set(r);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.error.set(parseApiError(err, 'Chargement des commandes impossible.').message);
        },
      });
  }

  exportShipping(): void {
    this.exporting.set(true);
    this.api.exportShipping(this.shipping() || 'TO_SHIP').subscribe({
      next: (res) => {
        this.exporting.set(false);
        if (res.body) {
          saveBlob(res.body, filenameFrom(res, 'preparation-commandes.csv'));
        }
      },
      error: (err: unknown) => {
        this.exporting.set(false);
        this.error.set(parseApiError(err, 'Export impossible.').message);
      },
    });
  }
}
