import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Clock, Loader2, Lock, LucideAngularModule, ShieldCheck } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import type {
  PaymentIntent,
  Stripe,
  StripeElements,
  StripeError,
  StripeExpressCheckoutElement,
  StripeExpressCheckoutElementConfirmEvent,
  StripePaymentElement,
} from '@stripe/stripe-js';

import { environment } from '../../../environments/environment';
import { PaymentSession } from '../../core/models/tombola.models';
import { CartService } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { OrderService } from '../../core/services/order.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatEuros, plural } from '../../core/utils/format';
import { PAYMENT_APPEARANCE, PAYMENT_FONTS } from './payment-appearance';

type State = 'loading' | 'ready' | 'unpayable' | 'expired' | 'failed';

const GENERIC_ERROR = 'Le paiement n’a pas abouti. Vérifiez vos informations ou essayez un autre moyen de paiement.';

/**
 * Etape 2 : paiement integre a la page. Les champs carte (et Apple Pay /
 * Google Pay quand l'appareil les propose) sont rendus par le prestataire de
 * paiement dans des cadres securises, habilles aux couleurs du site. Aucune
 * redirection, aucune marque tierce : seule la page 3-D Secure de la banque
 * peut apparaitre.
 */
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment.component.html',
})
export class PaymentComponent {
  /** Parametre de route `:reference` (withComponentInputBinding). */
  readonly reference = input.required<string>();

  private readonly orders = inject(OrderService);
  private readonly cart = inject(CartService);
  readonly game = inject(GameService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly expressHost = viewChild<ElementRef<HTMLElement>>('expressHost');
  private readonly paymentHost = viewChild<ElementRef<HTMLElement>>('paymentHost');

  readonly icLock = Lock;
  readonly icShield = ShieldCheck;
  readonly icClock = Clock;
  readonly icLoader = Loader2;
  readonly formatEuros = formatEuros;
  readonly plural = plural;

  readonly state = signal<State>('loading');
  readonly session = signal<PaymentSession | null>(null);
  readonly fieldsReady = signal(false);
  readonly expressAvailable = signal(false);
  readonly paying = signal(false);
  readonly error = signal<string | null>(null);
  readonly fatalMessage = signal<string | null>(null);
  private readonly now = signal(Date.now());

  readonly remainingMs = computed(() => {
    const s = this.session();
    return s ? Math.max(0, new Date(s.expiresAt).getTime() - this.now()) : 0;
  });
  readonly remainingLabel = computed(() => {
    const total = Math.ceil(this.remainingMs() / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  });
  readonly lowTime = computed(() => this.remainingMs() < 5 * 60_000);
  readonly associationCents = computed(() => {
    const s = this.session();
    return s ? Math.floor((s.itemsCents * this.game.associationPercent()) / 100) : 0;
  });

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;
  private expressElement: StripeExpressCheckoutElement | null = null;

  constructor() {
    this.game.loadGame().subscribe();
    afterNextRender(() => {
      const id = setInterval(() => {
        this.now.set(Date.now());
        if (this.state() === 'ready' && this.session() && this.remainingMs() === 0 && !this.paying()) {
          this.state.set('expired');
          this.cart.setPendingOrder(null);
        }
      }, 1000);
      this.destroyRef.onDestroy(() => {
        clearInterval(id);
        this.paymentElement?.destroy();
        this.expressElement?.destroy();
      });
      void this.init();
    });
  }

  private async init(): Promise<void> {
    const reference = this.reference();
    let session = this.orders.takeCachedSession(reference);
    if (!session) {
      try {
        session = await firstValueFrom(this.orders.paymentSession(reference));
      } catch (err) {
        await this.handleUnpayable(err);
        return;
      }
    }
    this.session.set(session);
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.state.set('expired');
      return;
    }
    this.cart.setPendingOrder({ reference: session.orderReference, expiresAt: session.expiresAt });
    this.state.set('ready');

    try {
      // Charge le module uniquement dans le navigateur, a la demande.
      const { loadStripe } = await import('@stripe/stripe-js');
      this.stripe = await loadStripe(session.publishableKey, { locale: 'fr' });
    } catch {
      this.stripe = null;
    }
    if (!this.stripe) {
      this.fail('Le module de paiement n’a pas pu être chargé. Vérifiez votre connexion (ou désactivez un éventuel bloqueur) puis rechargez la page.');
      return;
    }
    // Laisse le rendu poser les conteneurs avant de monter les champs.
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.mountElements(session);
  }

  reload(): void {
    location.reload();
  }

  private mountElements(session: PaymentSession): void {
    const stripe = this.stripe!;
    const elements = stripe.elements({
      mode: 'payment',
      amount: session.totalCents,
      currency: 'eur',
      paymentMethodTypes: ['card'],
      appearance: PAYMENT_APPEARANCE,
      fonts: PAYMENT_FONTS,
      locale: 'fr',
    });
    this.elements = elements;

    // Apple Pay / Google Pay (affiches seulement si l'appareil les propose).
    const express = elements.create('expressCheckout', {
      buttonHeight: 48,
      buttonType: { applePay: 'buy', googlePay: 'buy' },
      buttonTheme: { applePay: 'black', googlePay: 'black' },
      paymentMethods: { applePay: 'auto', googlePay: 'auto', link: 'never', paypal: 'never', amazonPay: 'never', klarna: 'never' },
      layout: { maxColumns: 2, maxRows: 1, overflow: 'never' },
    });
    express.on('ready', (event) => {
      const available = event.availablePaymentMethods;
      this.zone.run(() => this.expressAvailable.set(!!available && Object.values(available).some(Boolean)));
    });
    express.on('confirm', (event) => void this.zone.run(() => this.confirm(event)));
    const expressHost = this.expressHost()?.nativeElement;
    if (expressHost) {
      express.mount(expressHost);
      this.expressElement = express;
    }

    // Carte bancaire.
    const payment = elements.create('payment', {
      layout: { type: 'tabs' },
      wallets: { applePay: 'never', googlePay: 'never', link: 'never' },
      terms: { card: 'never' },
    });
    payment.on('ready', () => this.zone.run(() => this.fieldsReady.set(true)));
    payment.on('loaderror', () => this.zone.run(() => this.fail('Le formulaire de paiement n’a pas pu être affiché. Merci de recharger la page.')));
    const paymentHost = this.paymentHost()?.nativeElement;
    if (paymentHost) {
      payment.mount(paymentHost);
      this.paymentElement = payment;
    }
  }

  /** Bouton « Payer » (carte) ou validation Apple Pay / Google Pay (`event`). */
  async confirm(event?: StripeExpressCheckoutElementConfirmEvent): Promise<void> {
    const session = this.session();
    if (!this.stripe || !this.elements || !session || this.paying()) {
      event?.paymentFailed({ reason: 'fail' });
      return;
    }
    if (this.remainingMs() === 0) {
      this.state.set('expired');
      event?.paymentFailed({ reason: 'fail' });
      return;
    }
    this.error.set(null);
    this.paying.set(true);

    const { error: submitError } = await this.elements.submit();
    if (submitError) {
      this.zone.run(() => {
        this.paying.set(false);
        this.error.set(this.messageFor(submitError));
      });
      event?.paymentFailed({ reason: 'fail' });
      return;
    }

    const returnUrl = `${environment.siteUrl.replace(/\/+$/, '')}/paiement/succes?ref=${encodeURIComponent(session.orderReference)}`;
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      clientSecret: session.clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    this.zone.run(() => {
      if (result.error) {
        this.paying.set(false);
        this.error.set(this.messageFor(result.error));
        event?.paymentFailed({ reason: 'fail' });
        return;
      }
      this.onPaid(result.paymentIntent);
    });
  }

  private onPaid(intent: PaymentIntent | undefined): void {
    const status = intent?.status;
    if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
      void this.router.navigate(['/paiement/succes'], { queryParams: { ref: this.reference() } });
      return;
    }
    this.paying.set(false);
    this.error.set(GENERIC_ERROR);
  }

  private messageFor(error: StripeError): string {
    // Les messages carte / validation sont localises en francais (`locale: 'fr'`).
    if ((error.type === 'card_error' || error.type === 'validation_error') && error.message) {
      return error.message;
    }
    if (error.code === 'payment_intent_unexpected_state') {
      return 'Cette commande a déjà été réglée ou n’est plus payable.';
    }
    return GENERIC_ERROR;
  }

  private fail(message: string): void {
    this.fatalMessage.set(message);
    this.state.set('failed');
  }

  private async handleUnpayable(err: unknown): Promise<void> {
    const parsed = parseApiError(err, 'Impossible de retrouver cette commande.');
    if (err instanceof HttpErrorResponse && (err.status === 409 || err.status === 404)) {
      try {
        const status = await firstValueFrom(this.orders.status(this.reference()));
        if (status.status === 'PAID') {
          void this.router.navigate(['/paiement/succes'], { queryParams: { ref: this.reference() } });
          return;
        }
      } catch {
        // ignore
      }
      this.cart.setPendingOrder(null);
      this.fatalMessage.set(
        err.status === 404
          ? 'Cette commande est introuvable.'
          : 'Le délai de réservation de cette commande est dépassé ou elle a été annulée. Vos articles ont été remis en vente : vous pouvez repasser commande en quelques secondes.',
      );
      this.state.set('unpayable');
      return;
    }
    this.fail(parsed.message);
  }
}
