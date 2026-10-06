import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CircleCheck, Heart, Loader2, LucideAngularModule } from 'lucide-angular';

import { OrderStatusResponse } from '../../core/models/tombola.models';
import { CartService } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { OrderService } from '../../core/services/order.service';
import { plural } from '../../core/utils/format';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30;

type State = 'polling' | 'paid' | 'pending' | 'failed' | 'error' | 'missing';

/**
 * Retour de paiement : interroge `GET /public/orders/{ref}/status` toutes les
 * 2 s (30 essais) jusqu'a `PAID`, puis affiche les numeros de participation.
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page max-w-2xl pb-12 pt-10">
      @switch (state()) {
        @case ('polling') {
          <div class="card p-8 text-center" role="status">
            <lucide-icon [img]="icLoader" [size]="28" class="spin mx-auto mb-4 text-ink" aria-hidden="true" />
            <h1 class="mb-2">Confirmation de votre paiement…</h1>
            <p class="text-ink-600">Cela ne prend généralement que quelques secondes. Merci de ne pas fermer cette page.</p>
          </div>
        }
        @case ('paid') {
          @if (status(); as s) {
            <div class="card p-6 sm:p-8">
              <lucide-icon [img]="icCheck" [size]="36" class="mb-3 text-go-700" aria-hidden="true" />
              <h1 class="mb-2">Merci, votre commande est confirmée !</h1>
              <p class="text-ink-700">
                Commande <strong>{{ s.orderReference }}</strong> : votre achat vous donne droit à
                <strong>{{ plural(s.chances, 'participation') }}</strong> au tirage. Un e-mail de confirmation a été envoyé à
                <strong>{{ s.email }}</strong>.
              </p>
              @if (s.ticketNumbers?.length) {
                <h2 class="mb-3 mt-6 text-lg">Vos numéros de participation</h2>
                <ul class="flex flex-wrap gap-2" aria-label="Numéros de participation">
                  @for (t of s.ticketNumbers; track t) {
                    <li class="rounded-lg border border-dashed border-ink-300 bg-ink-100 px-3 py-1.5 font-mono text-sm font-semibold text-ink">{{ t }}</li>
                  }
                </ul>
              }
              <p class="mt-6 flex items-start gap-2 rounded-lg bg-go-50 px-4 py-3 text-sm text-go-700">
                <lucide-icon [img]="icHeart" [size]="17" class="mt-0.5 shrink-0" aria-hidden="true" />
                Merci pour votre générosité : {{ game.associationPercent() }} % du montant de vos packs est reversé à l’association {{ game.associationName() }}.
              </p>
              <p class="mt-4 text-sm text-ink-600">
                Vos produits seront expédiés à l’adresse indiquée. Vous pourrez retrouver à tout moment vos commandes et numéros depuis
                <a routerLink="/mes-participations">Mes participations</a>.
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/" class="btn-primary">Retour à l’accueil</a>
                <a routerLink="/" fragment="participer" class="btn-secondary">Offrir un autre pack</a>
              </div>
            </div>
          }
        }
        @case ('pending') {
          <div class="card p-6 sm:p-8">
            <h1 class="mb-2">Paiement en cours de confirmation</h1>
            <p class="text-ink-700">
              Votre banque met un peu plus de temps que prévu à confirmer le paiement de la commande <strong>{{ reference() }}</strong>.
              Dès qu’il sera validé, vous recevrez un e-mail avec vos numéros de participation.
            </p>
            <div class="mt-5 flex flex-wrap gap-3">
              <button type="button" class="btn-primary" (click)="start()">Vérifier à nouveau</button>
              <a routerLink="/mes-participations" class="btn-secondary">Mes participations</a>
            </div>
          </div>
        }
        @case ('failed') {
          <div class="card p-6 sm:p-8">
            <h1 class="mb-2">Le paiement n’a pas abouti</h1>
            <p class="text-ink-700">Aucun montant n’a été débité. Vous pouvez réessayer avec la même carte ou un autre moyen de paiement.</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <a [routerLink]="['/commande/paiement', reference()]" class="btn-primary">Réessayer le paiement</a>
              <a routerLink="/" fragment="participer" class="btn-secondary">Retour au panier</a>
            </div>
          </div>
        }
        @case ('missing') {
          <div class="card p-6 sm:p-8">
            <h1 class="mb-2">Commande introuvable</h1>
            <p class="text-ink-700">Le lien ne contient pas de référence de commande valide.</p>
            <a routerLink="/mes-participations" class="btn-secondary mt-5">Retrouver mes participations</a>
          </div>
        }
        @default {
          <div class="card p-6 sm:p-8">
            <h1 class="mb-2">Statut momentanément indisponible</h1>
            <p class="text-ink-700">
              Nous n’arrivons pas à vérifier votre commande <strong>{{ reference() }}</strong> pour le moment. Si votre paiement a été accepté, vous
              recevrez un e-mail de confirmation.
            </p>
            <button type="button" class="btn-primary mt-5" (click)="start()">Réessayer</button>
          </div>
        }
      }
    </div>
  `,
})
export class PaymentSuccessComponent {
  /** `?ref=` */
  readonly ref = input<string | undefined>(undefined);
  /** Ajoute par le prestataire en cas de retour 3-D Secure. */
  readonly redirect_status = input<string | undefined>(undefined);

  private readonly orders = inject(OrderService);
  private readonly cart = inject(CartService);
  readonly game = inject(GameService);

  readonly icLoader = Loader2;
  readonly icCheck = CircleCheck;
  readonly icHeart = Heart;
  readonly plural = plural;

  readonly state = signal<State>('polling');
  readonly status = signal<OrderStatusResponse | null>(null);
  readonly reference = () => this.ref() ?? '';

  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;

  constructor() {
    this.game.loadGame().subscribe();
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.stop());
    afterNextRender(() => {
      if (!this.reference()) {
        this.state.set('missing');
        return;
      }
      if (this.redirect_status() === 'failed') {
        this.state.set('failed');
        return;
      }
      this.start();
    });
  }

  start(): void {
    this.stop();
    this.attempts = 0;
    this.state.set('polling');
    this.poll();
  }

  private poll(): void {
    this.attempts++;
    this.orders.status(this.reference()).subscribe({
      next: (s) => {
        this.status.set(s);
        if (s.status === 'PAID') {
          this.state.set('paid');
          this.cart.clear();
          this.cart.setPendingOrder(null);
          return;
        }
        if (s.status === 'EXPIRED' || s.status === 'CANCELLED' || s.status === 'REFUNDED') {
          this.state.set('failed');
          return;
        }
        this.next();
      },
      error: () => this.next(true),
    });
  }

  private next(failed = false): void {
    if (this.attempts >= POLL_MAX_ATTEMPTS) {
      this.state.set(failed ? 'error' : 'pending');
      return;
    }
    this.timer = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  private stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
