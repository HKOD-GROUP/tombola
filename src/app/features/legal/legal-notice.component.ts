import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GameService } from '../../core/services/game.service';
import { TodoComponent } from '../../shared/components/todo.component';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [RouterLink, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page pb-6 pt-10">
      <p class="eyebrow mb-2">Informations légales</p>
      <h1 class="mb-6">Mentions légales</h1>
      <article class="prose-legal">
        <h2>Éditeur du site</h2>
        <p>
          <app-todo [value]="game.game()?.organizerName" /><br />
          <app-todo [value]="game.game()?.organizerDetails" [multiline]="true" hint="Forme juridique, capital, RCS, SIRET, adresse du siège, TVA intracommunautaire" />
        </p>
        <p>Directeur de la publication : <span class="badge-todo">À compléter</span></p>
        <p>Contact : <span class="badge-todo">À compléter</span> (adresse e-mail et téléphone)</p>

        <h2>Hébergement</h2>
        <p>
          OVH SAS — 2 rue Kellermann, 59100 Roubaix, France — www.ovhcloud.com
          <span class="badge-todo">À confirmer</span>
        </p>

        <h2>Jeu</h2>
        <p>
          Le jeu proposé sur ce site est régi par son <a routerLink="/reglement">règlement</a>, déposé chez
          <app-todo [value]="game.game()?.bailiffName" />, commissaire de justice.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L’ensemble des contenus de ce site (textes, visuels, logos) est protégé. Toute reproduction sans autorisation préalable de
          l’éditeur est interdite.
        </p>

        <h2>Données personnelles</h2>
        <p>Voir la <a routerLink="/confidentialite">politique de confidentialité</a>.</p>
      </article>
    </div>
  `,
})
export class LegalNoticeComponent {
  readonly game = inject(GameService);
  constructor() {
    this.game.loadGame().subscribe();
  }
}
