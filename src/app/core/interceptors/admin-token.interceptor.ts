import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ADMIN_COOKIE, AdminAuthService } from '../services/admin-auth.service';
import { getCookie } from '../tokens/platform.tokens';

/**
 * Ajoute le jeton du back-office aux appels `/admin-console/**` (sauf la
 * creation de session). Un 401 renvoie vers l'ecran de connexion.
 */
export const adminTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/admin-console/') || req.url.endsWith('/admin-console/session')) {
    return next(req);
  }
  const auth = inject(AdminAuthService);
  const token = auth.token() ?? getCookie(ADMIN_COOKIE);
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.expire();
      }
      return throwError(() => err);
    }),
  );
};
