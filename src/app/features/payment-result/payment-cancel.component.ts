import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page max-w-2xl pb-12 pt-10">
      <div class="card p-6 sm:p-8">
        <h1 class="mb-2">Paiement interrompu</h1>
        <p class="text-ink-700">
          Aucun montant n’a été débité.
          @if (ref()) {
            Votre commande <strong>{{ ref() }}</strong> reste réservée pendant 30 minutes à compter de sa création : vous pouvez reprendre le
            paiement, ou modifier votre panier et repasser commande.
          } @else {
            Votre panier est conservé : vous pouvez le modifier et repasser commande quand vous le souhaitez.
          }
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          @if (ref()) {
            <a [routerLink]="['/commande/paiement', ref()]" class="btn-primary">Reprendre le paiement</a>
          }
          <a routerLink="/" fragment="panier" class="btn-secondary">Retour au panier</a>
        </div>
      </div>
    </div>
  `,
})
export class PaymentCancelComponent {
  readonly ref = input<string | undefined>(undefined);
}
