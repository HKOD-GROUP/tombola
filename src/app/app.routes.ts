import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { SeoConfig } from './core/services/seo.service';

const seo = (config: SeoConfig) => ({ seo: config });

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    data: seo({
      title: 'Tombola solidaire — des packs qui donnent droit à des participations',
      description:
        'Porte-clés, t-shirts, casquettes : chaque pack de produits donne droit à des participations au tirage. 10 % reversés à l’association Les enfants oubliés.',
    }),
  },
  {
    // L'ancienne boutique : le parcours d'achat est integre a l'accueil (#participer).
    path: 'participer',
    redirectTo: () => inject(Router).createUrlTree(['/'], { fragment: 'participer' }),
  },
  {
    path: 'commande',
    loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
    data: seo({ title: 'Ma commande | Tombola', description: 'Vos coordonnées de livraison.', noindex: true }),
  },
  {
    path: 'commande/paiement/:reference',
    loadComponent: () => import('./features/payment/payment.component').then((m) => m.PaymentComponent),
    data: seo({ title: 'Paiement sécurisé | Tombola', description: 'Réglez votre commande.', noindex: true }),
  },
  {
    path: 'paiement/succes',
    loadComponent: () => import('./features/payment-result/payment-success.component').then((m) => m.PaymentSuccessComponent),
    data: seo({ title: 'Merci pour votre commande | Tombola', description: 'Confirmation de commande.', noindex: true }),
  },
  {
    path: 'paiement/annule',
    loadComponent: () => import('./features/payment-result/payment-cancel.component').then((m) => m.PaymentCancelComponent),
    data: seo({ title: 'Paiement interrompu | Tombola', description: 'Votre paiement n’a pas été finalisé.', noindex: true }),
  },
  {
    path: 'mes-participations',
    loadComponent: () => import('./features/my-entries/request-link.component').then((m) => m.RequestLinkComponent),
    data: seo({
      title: 'Mes participations | Tombola',
      description: 'Recevez par e-mail un lien pour retrouver vos commandes et vos numéros de participation.',
      noindex: true,
    }),
  },
  {
    path: 'mes-participations/:token',
    loadComponent: () => import('./features/my-entries/my-entries.component').then((m) => m.MyEntriesComponent),
    data: seo({ title: 'Mes participations | Tombola', description: 'Vos commandes et numéros de participation.', noindex: true }),
  },
  {
    path: 'le-jeu',
    loadComponent: () => import('./features/game/game.component').then((m) => m.GameComponent),
    data: seo({
      title: 'Le jeu et l’association Les enfants oubliés | Tombola',
      description: 'Qui organise le jeu, comment se déroule le tirage, et à quoi servent les 10 % reversés à l’association Les enfants oubliés.',
    }),
  },
  {
    path: 'reglement',
    loadComponent: () => import('./features/legal/rules.component').then((m) => m.RulesComponent),
    data: seo({
      title: 'Règlement du jeu | Tombola',
      description: 'Règlement complet du jeu, déposé chez un commissaire de justice : conditions, dotations, tirage, données personnelles.',
    }),
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./features/legal/legal-notice.component').then((m) => m.LegalNoticeComponent),
    data: seo({ title: 'Mentions légales | Tombola', description: 'Éditeur, hébergeur et contact du site.' }),
  },
  {
    path: 'cgv',
    loadComponent: () => import('./features/legal/terms.component').then((m) => m.TermsComponent),
    data: seo({ title: 'Conditions générales de vente | Tombola', description: 'Conditions de vente des packs de produits.' }),
  },
  {
    path: 'confidentialite',
    loadComponent: () => import('./features/legal/privacy.component').then((m) => m.PrivacyComponent),
    data: seo({ title: 'Politique de confidentialité | Tombola', description: 'Comment vos données personnelles sont utilisées et protégées.' }),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    data: seo({ title: 'Back-office | Tombola', description: 'Administration.', noindex: true }),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
    data: seo({ title: 'Page introuvable | Tombola', description: 'Cette page n’existe pas.', noindex: true }),
  },
];
