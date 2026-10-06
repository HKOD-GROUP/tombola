import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CheckoutRequest,
  MyParticipations,
  OrderStatusResponse,
  PaymentSession,
} from '../models/tombola.models';
import { PUBLIC_API } from './api';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  /** Derniere session de paiement creee (evite un aller-retour a l'arrivee sur la page de paiement). */
  private lastSession: PaymentSession | null = null;

  checkout(request: CheckoutRequest): Observable<PaymentSession> {
    return this.http
      .post<PaymentSession>(`${PUBLIC_API}/orders/checkout`, request)
      .pipe(tap((s) => (this.lastSession = s)));
  }

  /** Session en memoire pour cette reference (puis oubliee), sinon `null`. */
  takeCachedSession(reference: string): PaymentSession | null {
    const s = this.lastSession;
    this.lastSession = null;
    return s && s.orderReference === reference ? s : null;
  }

  /** Reprise du paiement apres rechargement : 409 `ORDER_NOT_PAYABLE` si expiree / payee. */
  paymentSession(reference: string): Observable<PaymentSession> {
    return this.http.get<PaymentSession>(`${PUBLIC_API}/orders/${encodeURIComponent(reference)}/payment`);
  }

  status(reference: string): Observable<OrderStatusResponse> {
    return this.http.get<OrderStatusResponse>(`${PUBLIC_API}/orders/${encodeURIComponent(reference)}/status`);
  }

  requestAccessLink(email: string): Observable<unknown> {
    return this.http.post(`${PUBLIC_API}/orders/access-link`, { email });
  }

  me(token: string): Observable<MyParticipations> {
    return this.http.get<MyParticipations>(`${PUBLIC_API}/orders/me`, { params: { token } });
  }
}
