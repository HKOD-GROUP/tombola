import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  Boxes,
  ExternalLink,
  Gift,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  Settings,
  ShoppingCart,
  Ticket,
} from 'lucide-angular';

import { AdminAuthService } from '../../core/services/admin-auth.service';
import { BrandMarkComponent } from '../../shared/components/brand-mark.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, BrandMarkComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-ink-100 lg:flex">
      <aside class="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div class="flex items-center justify-between gap-2 px-4 py-3 lg:py-5">
          <a routerLink="/admin" class="flex items-center gap-2 text-ink no-underline">
            <app-brand-mark [size]="26" />
            <span class="font-display font-semibold">Back-office</span>
          </a>
          <button type="button" class="btn-ghost btn-sm lg:hidden" (click)="auth.logout()">
            <lucide-icon [img]="icLogout" [size]="16" aria-hidden="true" /> Quitter
          </button>
        </div>
        <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Back-office">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="!bg-ink !text-white"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 no-underline hover:bg-ink-100 hover:text-ink"
            >
              <lucide-icon [img]="item.icon" [size]="17" aria-hidden="true" />
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="hidden px-3 pt-6 lg:block">
          <a href="/" target="_blank" class="flex items-center gap-2 px-3 py-2 text-sm text-ink-500 no-underline hover:text-ink">
            <lucide-icon [img]="icExternal" [size]="15" aria-hidden="true" /> Voir le site
          </a>
          <button type="button" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-500 hover:bg-ink-100 hover:text-ink" (click)="auth.logout()">
            <lucide-icon [img]="icLogout" [size]="15" aria-hidden="true" /> Se déconnecter
          </button>
        </div>
      </aside>
      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminShellComponent {
  readonly auth = inject(AdminAuthService);
  readonly icLogout = LogOut;
  readonly icExternal = ExternalLink;
  readonly nav = [
    { path: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
    { path: '/admin/commandes', label: 'Commandes', icon: ShoppingCart, exact: false },
    { path: '/admin/stock', label: 'Stock & packs', icon: Boxes, exact: false },
    { path: '/admin/participations', label: 'Participations & tirage', icon: Ticket, exact: false },
    { path: '/admin/lots', label: 'Lots', icon: Gift, exact: false },
    { path: '/admin/reglages', label: 'Réglages', icon: Settings, exact: false },
  ];
}
