import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeCheck, Gavel, Headset, Lock, LucideAngularModule } from 'lucide-angular';

import { GameService } from '../../core/services/game.service';
import { BrandMarkComponent } from '../components/brand-mark.component';
import { PaymentLogosComponent } from '../components/payment-logos.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, BrandMarkComponent, PaymentLogosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="on-dark bg-black text-white">
      <!-- Reassurance -->
      <section class="container-page py-12 sm:py-14" aria-label="Nos engagements">
        <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          @for (item of promises; track item.title) {
            <li class="flex flex-col items-center rounded-lg bg-[#1b1b1e] px-3 py-6 text-center sm:px-5">
              <span class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black">
                <lucide-icon [img]="item.icon" [size]="22" aria-hidden="true" />
              </span>
              <h2 class="text-[15px] leading-5 !text-white">{{ item.title }}</h2>
              <p class="mt-1.5 text-[12.5px] leading-[18px] text-white/70">{{ item.text }}</p>
            </li>
          }
        </ul>
      </section>

      <div class="border-t border-white/20">
        <div class="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <app-brand-mark [size]="26" />
            <p class="mt-4 max-w-xs text-sm text-white/75">
              Des packs de produits qui donnent droit à des participations au tirage. {{ game.associationPercent() }} % du montant des
              packs reversés à l’association {{ game.associationName() }}.
            </p>
            <img src="img/logo-les-oublies.png" [alt]="'Logo de l’association ' + game.associationName()" width="96" height="84" class="mt-5 h-auto w-24" loading="lazy" />
            <p class="mt-4 text-xs text-white/55">
              Jeu réservé aux personnes majeures résidant en France métropolitaine. Règlement déposé chez un commissaire de justice.
            </p>
          </div>
          <nav aria-label="Menu du site">
            <h2 class="mb-4 font-sans text-sm font-semibold normal-case not-italic !text-white">Menu</h2>
            <ul class="space-y-2.5 text-sm">
              <li><a routerLink="/" class="text-white/75 no-underline hover:text-white">Accueil</a></li>
              <li><a routerLink="/" fragment="participer" class="text-white/75 no-underline hover:text-white">Participer</a></li>
              <li><a routerLink="/le-jeu" class="text-white/75 no-underline hover:text-white">Le jeu &amp; l’association</a></li>
              <li><a routerLink="/mes-participations" class="text-white/75 no-underline hover:text-white">Mes participations</a></li>
            </ul>
          </nav>
          <nav aria-label="Informations légales">
            <h2 class="mb-4 font-sans text-sm font-semibold normal-case not-italic !text-white">Légal</h2>
            <ul class="space-y-2.5 text-sm">
              <li><a routerLink="/reglement" class="text-white/75 no-underline hover:text-white">Règlement du jeu</a></li>
              <li><a routerLink="/cgv" class="text-white/75 no-underline hover:text-white">Conditions générales de vente</a></li>
              <li><a routerLink="/mentions-legales" class="text-white/75 no-underline hover:text-white">Mentions légales</a></li>
              <li><a routerLink="/confidentialite" class="text-white/75 no-underline hover:text-white">Politique de confidentialité</a></li>
            </ul>
          </nav>
        </div>
        <div class="container-page">
          <div class="flex flex-col-reverse gap-4 border-t border-white/20 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-white/55">© {{ year }} {{ game.gameName() }} — paiement sécurisé, livraison en France métropolitaine.</p>
            <app-payment-logos />
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class SiteFooterComponent {
  readonly game = inject(GameService);
  readonly year = new Date().getFullYear();

  readonly promises = [
    { icon: Lock, title: 'Sécurisé', text: 'Paiement chiffré. Tes coordonnées bancaires ne passent pas par nos serveurs.' },
    { icon: BadgeCheck, title: 'Garantie', text: 'Chaque commande payée est expédiée, numéros de participation envoyés par e-mail.' },
    { icon: Gavel, title: 'Encadré', text: 'Règlement déposé et tirage au sort réalisés par un commissaire de justice.' },
    { icon: Headset, title: 'Support', text: 'Une question sur ta commande ? Retrouve-la à tout moment dans « Mes participations ».' },
  ];
}
