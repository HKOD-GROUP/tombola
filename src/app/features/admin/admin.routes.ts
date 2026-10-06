import { Routes } from '@angular/router';

import { adminGuard } from '../../core/guards/admin.guard';

/** Back-office (CSR uniquement, cf. `server.ts`), charge a la demande. */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'connexion',
    loadComponent: () => import('./login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'commandes', loadComponent: () => import('./orders.component').then((m) => m.AdminOrdersComponent) },
      { path: 'commandes/:id', loadComponent: () => import('./order-detail.component').then((m) => m.AdminOrderDetailComponent) },
      { path: 'stock', loadComponent: () => import('./stock.component').then((m) => m.AdminStockComponent) },
      { path: 'participations', loadComponent: () => import('./entries.component').then((m) => m.AdminEntriesComponent) },
      { path: 'lots', loadComponent: () => import('./prizes.component').then((m) => m.AdminPrizesComponent) },
      { path: 'reglages', loadComponent: () => import('./settings.component').then((m) => m.AdminSettingsComponent) },
    ],
  },
];
