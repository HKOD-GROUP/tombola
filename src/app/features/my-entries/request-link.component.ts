import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Loader2, LucideAngularModule, Mail } from 'lucide-angular';

import { OrderService } from '../../core/services/order.service';
import { parseApiError } from '../../core/utils/api-error';
import { EMAIL_PATTERN } from '../../core/utils/validators';

/** Demande d'un lien magique pour retrouver ses commandes et participations. */
@Component({
  selector: 'app-request-link',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page max-w-xl pb-12 pt-10">
      <p class="eyebrow mb-2">Mes participations</p>
      <h1 class="mb-2">Retrouver mes participations</h1>
      <p class="mb-6 text-ink-600">
        Pas besoin de compte : indiquez l’adresse e-mail utilisée lors de votre commande, nous vous envoyons un lien personnel (valable 7 jours)
        pour consulter vos commandes, leur suivi et vos numéros de participation.
      </p>
      @if (expired()) {
        <p class="alert-info mb-4">Le lien utilisé n’est plus valide. Demandez-en un nouveau ci-dessous.</p>
      }
      @if (sent()) {
        <div class="alert-success" role="status">
          <p class="font-semibold">Vérifiez votre boîte de réception.</p>
          <p class="mt-1">
            Si une commande confirmée est associée à <strong>{{ sentTo() }}</strong>, vous allez recevoir un e-mail contenant votre lien d’accès.
            Pensez à regarder dans les courriers indésirables.
          </p>
        </div>
        <button type="button" class="btn-ghost mt-4" (click)="sent.set(false)">Utiliser une autre adresse</button>
      } @else {
        <form class="card p-5 sm:p-6" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label class="label" for="email">Adresse e-mail</label>
          <input id="email" type="email" class="input" formControlName="email" autocomplete="email" inputmode="email" aria-describedby="email-err" />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <p id="email-err" class="field-error">Indiquez une adresse e-mail valide.</p>
          }
          @if (error()) {
            <p class="alert-error mt-4" role="alert">{{ error() }}</p>
          }
          <button type="submit" class="btn-primary mt-5 w-full sm:w-auto" [disabled]="loading()">
            @if (loading()) {
              <lucide-icon [img]="icLoader" [size]="18" class="spin" aria-hidden="true" />
            } @else {
              <lucide-icon [img]="icMail" [size]="18" aria-hidden="true" />
            }
            Recevoir mon lien
          </button>
        </form>
      }
    </div>
  `,
})
export class RequestLinkComponent {
  /** `?expire=1` quand on arrive depuis un lien perime. */
  readonly expire = input<string | undefined>(undefined);
  private readonly orders = inject(OrderService);
  readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
  });
  readonly icMail = Mail;
  readonly icLoader = Loader2;
  readonly loading = signal(false);
  readonly sent = signal(false);
  readonly sentTo = signal('');
  readonly error = signal<string | null>(null);
  readonly expired = () => !!this.expire();

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const email = this.form.getRawValue().email.trim().toLowerCase();
    this.loading.set(true);
    this.error.set(null);
    this.orders.requestAccessLink(email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sentTo.set(email);
        this.sent.set(true);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const e = parseApiError(err, 'L’envoi a échoué. Merci de réessayer dans quelques instants.');
        this.error.set(e.status === 429 ? 'Trop de demandes pour cette adresse. Réessayez dans une heure.' : e.message);
      },
    });
  }
}
