import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ArrowLeft, Loader2, Lock, LucideAngularModule } from 'lucide-angular';

import { CheckoutRequest } from '../../core/models/tombola.models';
import { CartService, PendingOrder } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { OrderService } from '../../core/services/order.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatEuros } from '../../core/utils/format';
import {
  EMAIL_PATTERN,
  adultValidator,
  frenchPhoneValidator,
  normalizeFrenchPhone,
  postalCodeValidator,
} from '../../core/utils/validators';
import { CartSummaryComponent, cartTotals } from '../../shared/components/cart-summary.component';

const IDENTITY_KEY = 'tombola_identity_v1';
type FieldName = 'firstName' | 'lastName' | 'birthDate' | 'email' | 'phone' | 'addressLine1' | 'addressLine2' | 'postalCode' | 'city';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, CartSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent {
  readonly cart = inject(CartService);
  readonly game = inject(GameService);
  private readonly orders = inject(OrderService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly icBack = ArrowLeft;
  readonly icLock = Lock;
  readonly icLoader = Loader2;
  readonly formatEuros = formatEuros;

  readonly ready = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly stockProblem = signal(false);
  readonly pending = signal<PendingOrder | null>(null);
  readonly totals = computed(() => cartTotals(this.cart, this.game));

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    birthDate: ['', [Validators.required, adultValidator]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN), Validators.maxLength(160)]],
    phone: ['', [Validators.required, frenchPhoneValidator]],
    addressLine1: ['', [Validators.required, Validators.maxLength(160)]],
    addressLine2: ['', [Validators.maxLength(160)]],
    postalCode: ['', [Validators.required, postalCodeValidator]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    acceptRules: [false, Validators.requiredTrue],
    certifyAccurate: [false, Validators.requiredTrue],
    marketingOptIn: [false],
  });

  /** Erreurs serveur par champ (`fieldErrors`). */
  readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});

  constructor() {
    this.game.loadGame().subscribe();
    this.game.loadPacks().subscribe();
    afterNextRender(() => {
      this.cart.restore();
      this.pending.set(this.cart.getPendingOrder());
      this.restoreIdentity();
      this.ready.set(true);
    });
  }

  show(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  serverError(name: FieldName): string | undefined {
    return this.serverErrors()[name];
  }

  submit(): void {
    this.error.set(null);
    this.stockProblem.set(false);
    this.serverErrors.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }
    if (this.cart.isEmpty()) {
      this.error.set('Votre panier est vide.');
      return;
    }
    const v = this.form.getRawValue();
    const request: CheckoutRequest = {
      customer: {
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        birthDate: v.birthDate,
        email: v.email.trim().toLowerCase(),
        phone: normalizeFrenchPhone(v.phone.trim()),
        addressLine1: v.addressLine1.trim(),
        addressLine2: v.addressLine2.trim() || null,
        postalCode: v.postalCode.trim(),
        city: v.city.trim(),
      },
      items: this.cart.toCheckoutItems(),
      acceptRules: v.acceptRules,
      certifyAccurate: v.certifyAccurate,
      marketingOptIn: v.marketingOptIn,
    };
    this.saveIdentity();
    this.submitting.set(true);
    this.orders.checkout(request).subscribe({
      next: (session) => {
        this.cart.setPendingOrder({ reference: session.orderReference, expiresAt: session.expiresAt });
        void this.router.navigate(['/commande/paiement', session.orderReference]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const e = parseApiError(err, 'La commande n’a pas pu être créée. Merci de réessayer.');
        if (e.fieldErrors.length) {
          const map: Partial<Record<FieldName, string>> = {};
          for (const fe of e.fieldErrors) {
            const name = fe.field.replace(/^customer\./, '') as FieldName;
            map[name] = fe.message;
          }
          this.serverErrors.set(map);
        }
        if (e.code === 'OUT_OF_STOCK' || e.code === 'PACK_NOT_FOUND' || e.code === 'INVALID_SIZES') {
          this.stockProblem.set(true);
          this.game.loadStock().subscribe();
          this.game.loadPacks(true).subscribe();
        }
        if (e.code === 'GAME_NOT_OPEN') {
          this.game.loadGame(true).subscribe();
        }
        this.error.set(e.fieldErrors.length && !e.code ? 'Merci de corriger les champs signalés.' : e.message);
        setTimeout(() => this.host.nativeElement.querySelector('#erreur-commande')?.focus());
      },
    });
  }

  private focusFirstInvalid(): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector('.ng-invalid[formControlName]') as HTMLElement | null;
      el?.focus();
    });
  }

  private saveIdentity(): void {
    try {
      const { acceptRules, certifyAccurate, marketingOptIn, ...identity } = this.form.getRawValue();
      void acceptRules;
      void certifyAccurate;
      void marketingOptIn;
      sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    } catch {
      // stockage indisponible : pas grave
    }
  }

  private restoreIdentity(): void {
    try {
      const raw = sessionStorage.getItem(IDENTITY_KEY);
      if (raw) {
        this.form.patchValue(JSON.parse(raw) as Record<string, string>);
      }
    } catch {
      // ignore
    }
  }
}
