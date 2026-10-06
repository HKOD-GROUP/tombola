import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { AdminSession } from '../models/tombola.models';
import { deleteCookie, getCookie, setCookie } from '../tokens/platform.tokens';
import { ADMIN_API } from './api';

export const ADMIN_COOKIE = 'tombola_admin_token';

/** Session du back-office : JWT dedie (8 h) conserve dans le cookie `tombola_admin_token`. */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(getCookie(ADMIN_COOKIE));

  isLoggedIn(): boolean {
    const token = this.token() ?? getCookie(ADMIN_COOKIE);
    if (!token) {
      return false;
    }
    const exp = jwtExpiry(token);
    if (exp !== null && exp <= Date.now()) {
      this.clear();
      return false;
    }
    return true;
  }

  login(password: string): Observable<AdminSession> {
    return this.http.post<AdminSession>(`${ADMIN_API}/session`, { password }).pipe(
      tap((session) => {
        const expires = new Date(session.expiresAt).getTime();
        const days = Number.isFinite(expires) ? Math.max((expires - Date.now()) / 86_400_000, 0.01) : 8 / 24;
        setCookie(ADMIN_COOKIE, session.token, days, '/');
        this.token.set(session.token);
      }),
    );
  }

  logout(): void {
    this.clear();
    void this.router.navigate(['/admin/connexion']);
  }

  /** Session expiree / refusee : retour a la connexion en conservant la page demandee. */
  expire(): void {
    const current = this.router.url;
    this.clear();
    void this.router.navigate(['/admin/connexion'], {
      queryParams: current.startsWith('/admin') && !current.startsWith('/admin/connexion') ? { retour: current } : {},
    });
  }

  private clear(): void {
    deleteCookie(ADMIN_COOKIE, '/');
    this.token.set(null);
  }
}

/** Date d'expiration (ms) lue dans le claim `exp` du JWT, sans verification de signature. */
function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload || typeof atob === 'undefined') {
      return null;
    }
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
