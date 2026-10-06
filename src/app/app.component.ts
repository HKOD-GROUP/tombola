import { Component, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { SeoConfig, SeoService } from './core/services/seo.service';
import { SiteFooterComponent } from './shared/layout/site-footer.component';
import { SiteHeaderComponent } from './shared/layout/site-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  template: `
    @if (!isAdmin) {
      <a href="#contenu" class="sr-only-focusable fixed left-3 top-3 z-50 rounded-full bg-ink px-4 py-2 text-sm text-white">
        Aller au contenu
      </a>
      <app-site-header />
      <main id="contenu" class="min-h-[60vh]">
        <router-outlet />
      </main>
      <app-site-footer />
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  isAdmin = typeof location !== 'undefined' && /^\/admin(\/|$)/.test(location.pathname);

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.isAdmin = /^\/admin(\/|$|\?)/.test(e.urlAfterRedirects);
      let r = this.route.snapshot;
      let config: SeoConfig | undefined;
      while (r) {
        config = (r.data['seo'] as SeoConfig | undefined) ?? config;
        r = r.firstChild!;
      }
      if (config) {
        this.seo.apply(config);
      }
    });
  }
}
