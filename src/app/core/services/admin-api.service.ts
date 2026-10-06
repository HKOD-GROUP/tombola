import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdminEntry,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminPack,
  AdminPrize,
  AdminSettings,
  AdminStats,
  AdminStockItem,
  DrawExport,
  Page,
} from '../models/tombola.models';
import { ADMIN_API } from './api';

function params(values: Record<string, string | number | null | undefined>): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(values)) {
    if (v !== null && v !== undefined && v !== '') {
      p = p.set(k, String(v));
    }
  }
  return p;
}

/** Appels `/admin-console/**` (le jeton est ajoute par `adminTokenInterceptor`). */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${ADMIN_API}/stats`);
  }

  orders(q: { status?: string; shippingStatus?: string; q?: string; page: number; size: number }): Observable<Page<AdminOrderSummary>> {
    return this.http.get<Page<AdminOrderSummary>>(`${ADMIN_API}/orders`, { params: params(q) });
  }

  order(id: string): Observable<AdminOrderDetail> {
    return this.http.get<AdminOrderDetail>(`${ADMIN_API}/orders/${encodeURIComponent(id)}`);
  }

  ship(id: string, trackingNumber: string | null): Observable<AdminOrderDetail> {
    return this.http.post<AdminOrderDetail>(`${ADMIN_API}/orders/${encodeURIComponent(id)}/ship`, { trackingNumber });
  }

  refund(id: string): Observable<unknown> {
    return this.http.post(`${ADMIN_API}/orders/${encodeURIComponent(id)}/refund`, {});
  }

  exportShipping(shippingStatus: string | null): Observable<HttpResponse<Blob>> {
    return this.http.get(`${ADMIN_API}/orders/export-shipping.csv`, {
      params: params({ shippingStatus }),
      responseType: 'blob',
      observe: 'response',
    });
  }

  stock(): Observable<AdminStockItem[]> {
    return this.http.get<AdminStockItem[]>(`${ADMIN_API}/stock`);
  }

  updateStock(sku: string, stock: number): Observable<unknown> {
    return this.http.put(`${ADMIN_API}/stock/${encodeURIComponent(sku)}`, { stock });
  }

  packs(): Observable<AdminPack[]> {
    return this.http.get<AdminPack[]>(`${ADMIN_API}/packs`);
  }

  updatePack(code: string, body: Pick<AdminPack, 'name' | 'description' | 'priceCents' | 'chances' | 'active' | 'imageUrl'>): Observable<unknown> {
    return this.http.put(`${ADMIN_API}/packs/${encodeURIComponent(code)}`, body);
  }

  settings(): Observable<AdminSettings> {
    return this.http.get<AdminSettings>(`${ADMIN_API}/settings`);
  }

  updateSettings(body: Omit<AdminSettings, 'closedAt'>): Observable<AdminSettings> {
    return this.http.put<AdminSettings>(`${ADMIN_API}/settings`, body);
  }

  prizes(): Observable<AdminPrize[]> {
    return this.http.get<AdminPrize[]>(`${ADMIN_API}/prizes`);
  }

  createPrize(body: Omit<AdminPrize, 'id'>): Observable<AdminPrize> {
    return this.http.post<AdminPrize>(`${ADMIN_API}/prizes`, body);
  }

  updatePrize(id: string, body: Omit<AdminPrize, 'id'>): Observable<AdminPrize> {
    return this.http.put<AdminPrize>(`${ADMIN_API}/prizes/${encodeURIComponent(id)}`, body);
  }

  deletePrize(id: string): Observable<unknown> {
    return this.http.delete(`${ADMIN_API}/prizes/${encodeURIComponent(id)}`);
  }

  upload(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${ADMIN_API}/uploads`, form);
  }

  entries(q: { q?: string; status?: string; page: number; size: number }): Observable<Page<AdminEntry>> {
    return this.http.get<Page<AdminEntry>>(`${ADMIN_API}/entries`, { params: params(q) });
  }

  cancelEntry(id: string, reason: string): Observable<unknown> {
    return this.http.post(`${ADMIN_API}/entries/${encodeURIComponent(id)}/cancel`, { reason });
  }

  closeDraw(): Observable<{ closedAt: string; export: DrawExport }> {
    return this.http.post<{ closedAt: string; export: DrawExport }>(`${ADMIN_API}/draw/close`, {});
  }

  createExport(): Observable<DrawExport> {
    return this.http.post<DrawExport>(`${ADMIN_API}/draw/exports`, {});
  }

  exports(): Observable<DrawExport[]> {
    return this.http.get<DrawExport[]>(`${ADMIN_API}/draw/exports`);
  }

  downloadExport(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${ADMIN_API}/draw/exports/${encodeURIComponent(id)}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}

/** Nom de fichier lu dans `Content-Disposition`, sinon `fallback`. */
export function filenameFrom(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // ignore
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : fallback;
}

/** Declenche le telechargement d'un Blob dans le navigateur. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Empreinte SHA-256 (hex) calculee dans le navigateur. */
export async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
