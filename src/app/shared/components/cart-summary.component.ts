import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LucideAngularModule, Minus, Plus, Trash2 } from 'lucide-angular';

import { CartService, MAX_PACKS_PER_ORDER } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { formatEuros, plural } from '../../core/utils/format';

export interface CartTotals {
  itemsCents: number;
  shippingCents: number;
  totalCents: number;
  chances: number;
  associationCents: number;
}

/** Calcule les totaux du panier a partir des prix publics (le back recalcule et fait foi). */
export function cartTotals(cart: CartService, game: GameService): CartTotals {
  let itemsCents = 0;
  let chances = 0;
  for (const line of cart.lines()) {
    const pack = game.packByCode(line.packCode);
    if (pack) {
      itemsCents += pack.priceCents * line.quantity;
      chances += pack.chances * line.quantity;
    }
  }
  const shippingCents = itemsCents > 0 ? (game.game()?.shippingFeeCents ?? 0) : 0;
  const associationCents = Math.floor((itemsCents * game.associationPercent()) / 100);
  return { itemsCents, shippingCents, totalCents: itemsCents + shippingCents, chances, associationCents };
}

/** Recapitulatif du panier, editable (boutique) ou en lecture seule (commande). */
@Component({
  selector: 'app-cart-summary',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cart.isEmpty()) {
      <p class="py-4 text-sm text-ink-600">Votre panier est vide. Choisissez un pack pour commencer.</p>
    } @else {
      <ul class="divide-y divide-line">
        @for (line of cart.lines(); track line.key) {
          @let pack = game.packByCode(line.packCode);
          <li class="flex gap-3 py-3">
            <div class="min-w-0 flex-1">
              <p class="font-display text-[14px] font-extrabold uppercase italic text-ink">{{ pack?.name ?? line.packCode }}</p>
              @if (line.tshirtSizes.length) {
                <p class="text-sm text-ink-600">
                  T-shirt{{ line.tshirtSizes.length > 1 ? 's' : '' }} : {{ line.tshirtSizes.join(' + ') }}
                </p>
              }
              @if (pack) {
                <p class="text-xs text-ink-500">{{ plural(pack.chances * line.quantity, 'participation') }}</p>
              }
              @if (editable()) {
                <div class="mt-2 flex items-center gap-2">
                  <div class="inline-flex items-center rounded-[6px] border border-ink-200 bg-white">
                    <button type="button" class="flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-ink-100"
                      [attr.aria-label]="'Retirer un ' + (pack?.name ?? 'pack')" (click)="cart.setQuantity(line.key, line.quantity - 1)">
                      <lucide-icon [img]="icMinus" [size]="16" aria-hidden="true" />
                    </button>
                    <span class="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ line.quantity }}</span>
                    <button type="button" class="flex h-9 w-9 items-center justify-center rounded-[6px] hover:bg-ink-100 disabled:opacity-40"
                      [disabled]="cart.count() >= max" [attr.aria-label]="'Ajouter un ' + (pack?.name ?? 'pack')"
                      (click)="cart.setQuantity(line.key, line.quantity + 1)">
                      <lucide-icon [img]="icPlus" [size]="16" aria-hidden="true" />
                    </button>
                  </div>
                  <button type="button" class="inline-flex h-9 items-center gap-1 rounded-[6px] px-2 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink"
                    (click)="cart.remove(line.key)" [attr.aria-label]="'Supprimer ' + (pack?.name ?? 'ce pack') + ' du panier'">
                    <lucide-icon [img]="icTrash" [size]="15" aria-hidden="true" /> Retirer
                  </button>
                </div>
              } @else if (line.quantity > 1) {
                <p class="text-sm text-ink-600">Quantité : {{ line.quantity }}</p>
              }
            </div>
            <p class="shrink-0 font-medium tabular-nums">{{ pack ? formatEuros(pack.priceCents * line.quantity) : '—' }}</p>
          </li>
        }
      </ul>
      <dl class="space-y-1.5 border-t border-line pt-3 text-sm">
        <div class="flex justify-between"><dt class="text-ink-600">Packs</dt><dd class="tabular-nums">{{ formatEuros(totals().itemsCents) }}</dd></div>
        <div class="flex justify-between">
          <dt class="text-ink-600">Livraison (France métropolitaine)</dt>
          <dd class="tabular-nums">{{ game.game() ? formatEuros(totals().shippingCents) : '—' }}</dd>
        </div>
        <div class="flex justify-between pt-1 text-base font-semibold">
          <dt>Total</dt><dd class="tabular-nums">{{ formatEuros(totals().totalCents) }}</dd>
        </div>
        <div class="flex justify-between text-ink-600">
          <dt>Participations au tirage</dt><dd class="font-bold text-ink">{{ totals().chances }}</dd>
        </div>
      </dl>
      <p class="mt-3 rounded-[4px] bg-go-50 px-3 py-2 text-xs font-medium text-go-700">
        Dont {{ formatEuros(totals().associationCents) }} reversés à l’association {{ game.associationName() }}
        ({{ game.associationPercent() }} % du montant des packs).
      </p>
    }
  `,
})
export class CartSummaryComponent {
  readonly cart = inject(CartService);
  readonly game = inject(GameService);
  readonly editable = input(true);
  readonly max = MAX_PACKS_PER_ORDER;

  readonly icMinus = Minus;
  readonly icPlus = Plus;
  readonly icTrash = Trash2;
  readonly formatEuros = formatEuros;
  readonly plural = plural;

  readonly totals = computed(() => cartTotals(this.cart, this.game));
}
