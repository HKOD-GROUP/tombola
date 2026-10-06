import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminStats } from '../../core/models/tombola.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatEuros } from '../../core/utils/format';
import { DailyChartComponent } from './daily-chart.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DailyChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1>Tableau de bord</h1>
      <button type="button" class="btn-secondary btn-sm" (click)="load()">Actualiser</button>
    </div>
    @if (error()) {
      <p class="alert-error mb-4" role="alert">{{ error() }}</p>
    }
    @if (stats(); as s) {
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="card p-4">
          <p class="text-xs text-ink-500">Chiffre d’affaires</p>
          <p class="font-display text-2xl font-semibold tabular-nums">{{ euros(s.revenueCents) }}</p>
          <p class="text-xs text-ink-500">dont livraison {{ euros(s.shippingCents) }}</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-ink-500">Pour l’association</p>
          <p class="font-display text-2xl font-semibold tabular-nums text-go-700">{{ euros(s.associationCents) }}</p>
          <p class="text-xs text-ink-500">sur {{ euros(s.itemsCents) }} de packs</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-ink-500">Commandes payées</p>
          <p class="font-display text-2xl font-semibold tabular-nums">{{ s.paidOrders }}</p>
          <p class="text-xs text-ink-500">{{ s.pendingOrders }} en attente · {{ s.refundedOrders }} remboursées</p>
        </div>
        <div class="card p-4">
          <p class="text-xs text-ink-500">Participations valides</p>
          <p class="font-display text-2xl font-semibold tabular-nums">{{ s.validEntries.toLocaleString('fr-FR') }}</p>
          <p class="text-xs text-ink-500">{{ s.cancelledEntries }} annulées</p>
        </div>
      </div>

      @if (s.toShip > 0) {
        <a routerLink="/admin/commandes" [queryParams]="{ expedition: 'TO_SHIP' }" class="alert-info mt-4 block no-underline">
          <strong>{{ s.toShip }}</strong> commande{{ s.toShip > 1 ? 's' : '' }} à expédier →
        </a>
      }

      <div class="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section class="card p-5">
          <app-daily-chart [days]="s.daily" />
        </section>
        <section class="card p-5">
          <h2 class="mb-3 font-sans text-base font-semibold">Ventes par pack</h2>
          <table class="table-admin">
            <thead><tr><th>Pack</th><th class="text-right">Vendus</th><th class="text-right">CA</th></tr></thead>
            <tbody>
              @for (p of s.packs; track p.code) {
                <tr>
                  <td>{{ p.name }}</td>
                  <td class="text-right tabular-nums">{{ p.sold }}</td>
                  <td class="text-right tabular-nums">{{ euros(p.revenueCents) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    } @else if (!error()) {
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
        @for (i of [0, 1, 2, 3]; track i) {
          <div class="card h-24 animate-pulse bg-ink-100"></div>
        }
      </div>
    }
  `,
})
export class AdminDashboardComponent {
  private readonly api = inject(AdminApiService);
  readonly stats = signal<AdminStats | null>(null);
  readonly error = signal<string | null>(null);
  readonly euros = (c: number) => formatEuros(c);

  constructor() {
    this.load();
  }

  load(): void {
    this.error.set(null);
    this.api.stats().subscribe({
      next: (s) => this.stats.set(s),
      error: (err: unknown) => this.error.set(parseApiError(err, 'Statistiques indisponibles.').message),
    });
  }
}
