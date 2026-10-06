import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameService } from '../../core/services/game.service';
import { TodoComponent } from '../../shared/components/todo.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page pb-6 pt-10">
      <p class="eyebrow mb-2">Informations légales</p>
      <h1 class="mb-3">Politique de confidentialité</h1>
      <p class="alert-info mb-8 max-w-[720px]"><strong>Version provisoire</strong> — à faire valider avant l’ouverture du jeu.</p>
      <article class="prose-legal">
        <h2>Responsable du traitement</h2>
        <p><app-todo [value]="game.game()?.organizerName" /> — <app-todo [value]="game.game()?.organizerDetails" /></p>

        <h2>Données collectées</h2>
        <ul>
          <li>Identité : nom, prénom, date de naissance (contrôle de la majorité).</li>
          <li>Coordonnées : adresse e-mail, téléphone, adresse de livraison.</li>
          <li>Commande : packs, tailles, montants, numéros de participation.</li>
          <li>Données techniques : adresse IP et navigateur au moment de la commande (prévention de la fraude, preuve).</li>
        </ul>
        <p>Aucune donnée bancaire n’est collectée ni conservée par nos soins.</p>

        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Gestion des commandes, du paiement et de la livraison (exécution du contrat).</li>
          <li>Organisation du jeu, contrôle de l’éligibilité, tirage et remise des lots (exécution du contrat, obligation légale).</li>
          <li>Transmission de la liste des participations au commissaire de justice (intérêt légitime, preuve).</li>
          <li>Envoi d’informations sur les prochaines opérations, uniquement si vous l’avez accepté (consentement).</li>
        </ul>

        <h2>Destinataires</h2>
        <ul>
          <li>L’organisateur et ses prestataires techniques (hébergement : OVH, France).</li>
          <li>
            Le prestataire de paiement, Stripe Payments Europe Ltd. (Irlande), qui traite les données de paiement pour le compte de
            l’organisateur, conformément à sa propre politique de confidentialité.
          </li>
          <li>Le transporteur, pour la livraison.</li>
          <li>Le commissaire de justice <app-todo [value]="game.game()?.bailiffName" />, pour le tirage.</li>
        </ul>
        <p>Vos données ne sont jamais vendues. L’association {{ game.associationName() }} ne reçoit pas vos données personnelles.</p>

        <h2>Durées de conservation</h2>
        <ul>
          <li>Commandes et factures : 10 ans (obligation comptable).</li>
          <li>Participations et export transmis au commissaire de justice : <span class="badge-todo">À compléter</span>.</li>
          <li>Consentement aux communications : 3 ans à compter du dernier contact.</li>
        </ul>

        <h2>Vos droits</h2>
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité. Pour l’exercer :
          <span class="badge-todo">À compléter</span> (adresse e-mail de contact). Vous pouvez également introduire une réclamation auprès de la
          CNIL (www.cnil.fr).
        </p>

        <h2>Cookies</h2>
        <p>
          Le site n’utilise pas de cookie publicitaire ni de mesure d’audience. Votre panier est conservé dans le stockage local de votre
          navigateur ; des cookies strictement nécessaires au paiement sécurisé et à la lutte contre la fraude peuvent être déposés.
        </p>

        <p class="mt-8 text-sm"><a routerLink="/mentions-legales">Mentions légales</a> · <a routerLink="/cgv">CGV</a></p>
      </article>
    </div>
  `,
})
export class PrivacyComponent {
  readonly game = inject(GameService);
  constructor() {
    this.game.loadGame().subscribe();
  }
}
