import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-page max-w-xl py-16 text-center">
      <p class="font-display text-5xl font-extrabold italic text-flame-500">404</p>
      <h1 class="mb-2 mt-3">Cette page est introuvable</h1>
      <p class="mb-6 text-ink-600">Le lien est peut-être incomplet ou la page a été déplacée.</p>
      <div class="flex flex-wrap justify-center gap-3">
        <a routerLink="/" class="btn-primary">Retour à l’accueil</a>
        <a routerLink="/" fragment="participer" class="btn-secondary">Voir les packs</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
