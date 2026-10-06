import { ChangeDetectionStrategy, Component, afterNextRender, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Loader2, LucideAngularModule, Truck } from 'lucide-angular';

import { MyParticipations, OrderStatus } from '../../core/models/tombola.models';
import { GameService } from '../../core/services/game.service';
import { OrderService } from '../../core/services/order.service';
import { formatDateTimeLong, formatEuros, plural } from '../../core/utils/format';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  PAID: 'Payée',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

@Component({
  selector: 'app-my-entries',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-entries.component.html',
})
export class MyEntriesComponent {
  readonly token = input.required<string>();
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);
  readonly game = inject(GameService);

  readonly icLoader = Loader2;
  readonly icTruck = Truck;
  readonly formatEuros = formatEuros;
  readonly formatDate = formatDateTimeLong;
  readonly plural = plural;
  readonly statusLabels = STATUS_LABELS;

  readonly data = signal<MyParticipations | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.game.loadGame().subscribe();
    afterNextRender(() => this.load());
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orders.me(this.token()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        if (err instanceof HttpErrorResponse && err.status === 401) {
          void this.router.navigate(['/mes-participations'], { queryParams: { expire: 1 }, replaceUrl: true });
          return;
        }
        this.error.set('Impossible de charger vos participations pour le moment. Merci de réessayer.');
      },
    });
  }

  validCount(entries: { status: string }[]): number {
    return entries.filter((e) => e.status === 'VALID').length;
  }
}
