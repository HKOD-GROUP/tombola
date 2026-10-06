import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Menu, ShoppingBag, X } from 'lucide-angular';
import { filter } from 'rxjs';

import { CartService } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { BrandMarkComponent } from '../components/brand-mark.component';
import { CountdownComponent } from '../components/countdown.component';

/** Parcours de commande : pas de compte a rebours du jeu (un minuteur de reservation y est deja affiche). */
const NO_COUNTDOWN = /^\/(commande|paiement)(\/|\?|#|$)/;

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, BrandMarkComponent, CountdownComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="on-dark sticky top-0 z-40 bg-black text-white">
      <div class="container-page relative flex h-14 items-center justify-between gap-3 md:h-16">
        <!-- Burger (mobile) -->
        <button
          type="button"
          class="-ml-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
          [attr.aria-expanded]="open()"
          aria-controls="menu-mobile"
          [attr.aria-label]="open() ? 'Fermer le menu' : 'Ouvrir le menu'"
          (click)="open.set(!open())"
        >
          <lucide-icon [img]="open() ? icX : icMenu" [size]="24" aria-hidden="true" />
        </button>

        <a
          routerLink="/"
          class="absolute left-1/2 -translate-x-1/2 text-white no-underline hover:text-white md:static md:translate-x-0"
          aria-label="Tombola — accueil"
        >
          <app-brand-mark [size]="24" />
        </a>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          @for (link of links; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="!text-white after:!scale-x-100"
              [routerLinkActiveOptions]="{ exact: link.path === '/' }"
              ariaCurrentWhenActive="page"
              class="relative px-3 py-2 text-[14px] font-medium text-white/80 no-underline after:absolute after:inset-x-3 after:bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform hover:text-white"
              >{{ link.label }}</a
            >
          }
        </nav>

        <a
          routerLink="/"
          fragment="panier"
          class="relative -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-md text-white no-underline hover:bg-white/10 hover:text-white"
          [attr.aria-label]="'Panier : ' + cart.count() + ' pack(s)'"
        >
          <lucide-icon [img]="icBag" [size]="22" aria-hidden="true" />
          @if (cart.count() > 0) {
            <span
              class="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-flame-500 px-1 text-[11px] font-bold text-white"
            >
              {{ cart.count() }}
            </span>
          }
        </a>
      </div>

      @if (open()) {
        <nav id="menu-mobile" class="border-t border-white/10 bg-black md:hidden" aria-label="Navigation mobile">
          <ul class="container-page flex flex-col py-2">
            @for (link of links; track link.path) {
              <li>
                <a
                  [routerLink]="link.path"
                  class="block border-b border-white/10 px-1 py-3.5 font-display text-[15px] font-extrabold uppercase italic text-white no-underline hover:text-white"
                  >{{ link.label }}</a
                >
              </li>
            }
            <li class="pb-3 pt-4">
              <a routerLink="/" fragment="participer" class="btn-go w-full">Je participe +</a>
            </li>
          </ul>
        </nav>
      }
    </header>
    @if (showCountdown() && game.game()) {
      <div class="on-dark border-t border-white/10 bg-black">
        <app-countdown [game]="game.game()" />
      </div>
    }
  `,
})
export class SiteHeaderComponent {
  readonly game = inject(GameService);
  readonly cart = inject(CartService);
  readonly open = signal(false);
  readonly showCountdown = signal(true);

  readonly icBag = ShoppingBag;
  readonly icMenu = Menu;
  readonly icX = X;

  readonly links = [
    { path: '/', label: 'Accueil' },
    { path: '/le-jeu', label: 'Le jeu & l’association' },
    { path: '/reglement', label: 'Règlement' },
    { path: '/mes-participations', label: 'Mes participations' },
  ];

  constructor() {
    this.game.loadGame().subscribe();
    const router = inject(Router);
    this.showCountdown.set(!NO_COUNTDOWN.test(router.url));
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.open.set(false);
      this.showCountdown.set(!NO_COUNTDOWN.test(e.urlAfterRedirects));
    });
    afterNextRender(() => this.cart.restore());
  }
}
