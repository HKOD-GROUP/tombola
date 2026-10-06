import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArrowLeft, LucideAngularModule, Truck } from 'lucide-angular';

import { AdminOrderDetail } from '../../core/models/tombola.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatDateTimeShort, formatEuros, formatPlainDate } from '../../core/utils/format';
import { ORDER_STATUS_BADGES, ORDER_STATUS_LABELS, SHIPPING_LABELS } from './admin-ui';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-detail.component.html',
})
export class AdminOrderDetailComponent {
  readonly id = input.required<string>();
  private readonly api = inject(AdminApiService);

  readonly icBack = ArrowLeft;
  readonly icTruck = Truck;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusBadges = ORDER_STATUS_BADGES;
  readonly shippingLabels = SHIPPING_LABELS;
  readonly euros = (c: number | null | undefined) => formatEuros(c);
  readonly date = formatDateTimeShort;
  readonly plainDate = formatPlainDate;

  readonly order = signal<AdminOrderDetail | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly busy = signal(false);
  readonly tracking = signal('');
  readonly confirmRefund = signal(false);

  /** Le detail peut exposer le client a plat ou sous `customer`. */
  readonly customer = computed(() => {
    const o = this.order();
    if (!o) {
      return null;
    }
    const c = o.customer ?? {};
    return {
      firstName: o.firstName ?? c.firstName,
      lastName: o.lastName ?? c.lastName,
      birthDate: o.birthDate ?? c.birthDate,
      email: o.email ?? c.email,
      phone: o.phone ?? c.phone,
      addressLine1: o.addressLine1 ?? c.addressLine1,
      addressLine2: o.addressLine2 ?? c.addressLine2,
      postalCode: o.postalCode ?? c.postalCode,
      city: o.city ?? c.city,
      country: o.country ?? c.country ?? 'FR',
    };
  });

  readonly audit = computed(() => this.order()?.audit ?? this.order()?.auditEvents ?? []);

  constructor() {
    queueMicrotask(() => this.load());
  }

  sizes(value: string[] | string | null | undefined): string {
    if (!value) {
      return '';
    }
    return Array.isArray(value) ? value.join(' + ') : value.split(',').join(' + ');
  }

  load(): void {
    this.api.order(this.id()).subscribe({
      next: (o) => {
        this.order.set(o);
        this.tracking.set(o.trackingNumber ?? '');
      },
      error: (err: unknown) => this.error.set(parseApiError(err, 'Commande introuvable.').message),
    });
  }

  ship(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.ship(this.id(), this.tracking().trim() || null).subscribe({
      next: (o) => {
        this.busy.set(false);
        this.order.set(o);
        this.notice.set('Commande marquée comme expédiée. Le client a été prévenu par e-mail.');
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(parseApiError(err, 'Mise à jour impossible.').message);
      },
    });
  }

  refund(): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.refund(this.id()).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmRefund.set(false);
        this.notice.set('Remboursement demandé. Les participations seront annulées dès la confirmation du remboursement (quelques secondes).');
        setTimeout(() => this.load(), 4000);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.confirmRefund.set(false);
        const e = parseApiError(err, 'Remboursement impossible.');
        this.error.set(e.status === 409 ? 'Seule une commande payée peut être remboursée.' : e.message);
      },
    });
  }
}
