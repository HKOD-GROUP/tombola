import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameService } from '../../core/services/game.service';
import { formatEuros, plural } from '../../core/utils/format';
import { TodoComponent } from '../../shared/components/todo.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page pb-6 pt-10">
      <p class="eyebrow mb-2">Informations légales</p>
      <h1 class="mb-3">Conditions générales de vente</h1>
      <p class="alert-info mb-8 max-w-[720px]"><strong>Version provisoire</strong> — à faire valider avant l’ouverture du jeu.</p>
      <article class="prose-legal">
        <h2>1. Vendeur</h2>
        <p>
          Les produits sont vendus par <app-todo [value]="game.game()?.organizerName" />
          (<app-todo [value]="game.game()?.organizerDetails" />).
        </p>

        <h2>2. Produits</h2>
        <p>Le site propose des packs de produits (porte-clés, t-shirts, casquettes). Chaque pack donne droit à des participations au jeu :</p>
        @if (game.packs(); as packs) {
          <ul>
            @for (p of packs; track p.code) {
              <li>
                {{ p.name }} —
                @for (c of p.components; track c.kind; let last = $last) {<span>{{ c.quantity }} {{ c.label.toLowerCase() }}{{ c.quantity > 1 ? 's' : '' }}{{ last ? '' : ', ' }}</span>}
                — {{ formatEuros(p.priceCents) }} TTC, donne droit à {{ plural(p.chances, 'participation') }}.
              </li>
            }
          </ul>
        }
        <p>Les t-shirts sont proposés en tailles S, M, L, XL et XXL, choisies pour chaque t-shirt lors de la commande. Visuels non contractuels.</p>

        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros toutes taxes comprises. Des frais de livraison forfaitaires
          @if (game.game(); as g) { de {{ formatEuros(g.shippingFeeCents) }} }
          s’appliquent par commande. Le paiement s’effectue en ligne par carte bancaire, Apple Pay ou Google Pay, au moment de la commande.
          Les articles sont réservés pendant 30 minutes dans l’attente du paiement.
        </p>

        <h2>4. Commande</h2>
        <p>
          La commande est passée sans création de compte. Elle est confirmée par un e-mail récapitulatif comprenant les numéros de
          participation. Les commandes sont réservées aux personnes majeures.
        </p>

        <h2>5. Livraison</h2>
        <p>
          Livraison uniquement en France métropolitaine (Corse comprise), à l’adresse indiquée lors de la commande. Délai indicatif :
          <span class="badge-todo">À compléter</span>. Un e-mail est envoyé à l’expédition, avec un numéro de suivi le cas échéant.
        </p>

        <h2>6. Droit de rétractation</h2>
        <p>
          Conformément aux articles L221-18 et suivants du Code de la consommation, vous disposez de 14 jours à compter de la réception des
          produits pour exercer votre droit de rétractation, sans avoir à motiver votre décision. Le remboursement intervient dans les 14 jours
          suivant la réception des produits retournés. <strong>Le remboursement d’une commande entraîne l’annulation des participations
          associées.</strong> Modalités de retour : <span class="badge-todo">À compléter</span>.
        </p>

        <h2>7. Garanties</h2>
        <p>Les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.</p>

        <h2>8. Association</h2>
        <p>
          {{ game.associationPercent() }} % du montant des packs (hors frais de livraison) sont reversés à l’association
          {{ game.associationName() }}. Ce reversement ne constitue pas un don ouvrant droit à réduction d’impôt pour l’acheteur.
        </p>

        <h2>9. Données personnelles</h2>
        <p>Voir la <a routerLink="/confidentialite">politique de confidentialité</a>.</p>

        <h2>10. Litiges et médiation</h2>
        <p>
          Les présentes conditions sont soumises au droit français. En cas de litige, vous pouvez recourir gratuitement à un médiateur de la
          consommation : <span class="badge-todo">À compléter</span>.
        </p>
      </article>
    </div>
  `,
})
export class TermsComponent {
  readonly game = inject(GameService);
  readonly formatEuros = formatEuros;
  readonly plural = plural;
  constructor() {
    this.game.loadGame().subscribe();
    this.game.loadPacks().subscribe();
  }
}
