import { InjectionToken, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

/**
 * En-tete `Cookie` de la requete HTTP en cours de rendu serveur (fourni par
 * `server.ts` a `CommonEngine.render`). Absent dans le navigateur et lors
 * d'un prerender : `getCookie()` retombe alors sur `document.cookie` ou
 * `null`.
 */
export const REQUEST_COOKIES = new InjectionToken<string | null>('REQUEST_COOKIES');

export function injectIsBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

export function injectIsServer(): boolean {
  return isPlatformServer(inject(PLATFORM_ID));
}

export function setCookie(name: string, value: string, days = 7, path = '/'): void {
  if (typeof document === 'undefined') {
    return;
  }
  const maxAge = days * 24 * 60 * 60;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax${secure}`;
}

/** Valeur d'un cookie dans une chaine `a=1; b=2` (format de l'en-tete `Cookie`). */
export function readCookieFrom(source: string | null | undefined, name: string): string | null {
  if (!source) {
    return null;
  }
  for (const raw of source.split(';')) {
    const trimmed = raw.trim();
    const eq = trimmed.indexOf('=');
    const key = eq === -1 ? trimmed : trimmed.slice(0, eq);
    if (key === name) {
      try {
        return decodeURIComponent(eq === -1 ? '' : trimmed.slice(eq + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Lit un cookie : `document.cookie` dans le navigateur ; cote serveur, l'en-tete
 * `Cookie` de la requete (`REQUEST_COOKIES`) quand on est dans un contexte
 * d'injection (constructeur de service, initializer...), sinon `null`.
 */
export function getCookie(name: string): string | null {
  if (typeof document !== 'undefined') {
    return readCookieFrom(document.cookie, name);
  }
  let header: string | null = null;
  try {
    header = inject(REQUEST_COOKIES, { optional: true }) ?? null;
  } catch {
    // Hors contexte d'injection (ex. callback) : pas de cookies cote serveur.
    header = null;
  }
  return readCookieFrom(header, name);
}

export function deleteCookie(name: string, path = '/'): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax`;
}
