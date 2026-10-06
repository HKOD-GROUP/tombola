import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
import { adminTokenInterceptor } from './core/interceptors/admin-token.interceptor';
import { serverTimeoutInterceptor } from './core/interceptors/server-timeout.interceptor';

registerLocaleData(localeFr, 'fr-FR');

/**
 * `provideClientHydration` volontairement omis (cf. socle HKOD) : le panier
 * et les comptes a rebours dependent du navigateur (localStorage, horloge) ;
 * le client re-rend la page servie par le SSR, sans risque de desynchronisation.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideHttpClient(withFetch(), withInterceptors([serverTimeoutInterceptor, adminTokenInterceptor])),
  ],
};
