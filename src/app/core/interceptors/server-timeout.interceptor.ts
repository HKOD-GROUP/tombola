import { HttpInterceptorFn } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { timeout } from 'rxjs';

/** Pendant le rendu serveur, une API lente ne doit pas bloquer la page : 4 s maximum. */
const SSR_API_TIMEOUT_MS = 4000;

export const serverTimeoutInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return next(req).pipe(timeout(SSR_API_TIMEOUT_MS));
  }
  return next(req);
};
