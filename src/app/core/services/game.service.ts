import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

import { Prize, PublicGame, PublicPack, PublicStock } from '../models/tombola.models';
import { PUBLIC_API } from './api';

/**
 * Donnees publiques du jeu (`/public/game`, `/public/packs`, `/public/stock`,
 * `/public/prizes`). Chaque ressource est chargee une fois puis partagee ; en
 * cas d'API indisponible, le signal reste `null` et les pages degradent
 * proprement (textes generiques, boutique en lecture seule).
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);

  readonly game = signal<PublicGame | null>(null);
  readonly packs = signal<PublicPack[] | null>(null);
  readonly stock = signal<PublicStock | null>(null);
  readonly prizes = signal<Prize[] | null>(null);
  /** `true` si un appel a echoue (API injoignable). */
  readonly gameError = signal(false);
  readonly packsError = signal(false);

  readonly associationName = computed(() => this.game()?.associationName || 'Les enfants oubliés');
  readonly associationPercent = computed(() => this.game()?.associationPercent ?? 10);
  readonly gameName = computed(() => this.game()?.gameName || 'Tombola');

  private game$: Observable<PublicGame | null> | null = null;
  private packs$: Observable<PublicPack[] | null> | null = null;
  private prizes$: Observable<Prize[] | null> | null = null;

  loadGame(force = false): Observable<PublicGame | null> {
    if (!this.game$ || force) {
      this.game$ = this.http.get<PublicGame>(`${PUBLIC_API}/game`).pipe(
        tap((g) => {
          this.game.set(g);
          this.gameError.set(false);
        }),
        catchError(() => {
          this.gameError.set(true);
          this.game$ = null;
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.game$;
  }

  loadPacks(force = false): Observable<PublicPack[] | null> {
    if (!this.packs$ || force) {
      this.packs$ = this.http.get<PublicPack[]>(`${PUBLIC_API}/packs`).pipe(
        tap((p) => {
          this.packs.set(p);
          this.packsError.set(false);
        }),
        catchError(() => {
          this.packsError.set(true);
          this.packs$ = null;
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.packs$;
  }

  /** Le stock n'est pas mis en cache : il change a chaque commande. */
  loadStock(): Observable<PublicStock | null> {
    return this.http.get<PublicStock>(`${PUBLIC_API}/stock`).pipe(
      tap((s) => this.stock.set(s)),
      catchError(() => of(null)),
    );
  }

  loadPrizes(): Observable<Prize[] | null> {
    if (!this.prizes$) {
      this.prizes$ = this.http.get<Prize[]>(`${PUBLIC_API}/prizes`).pipe(
        map((list) => [...list].sort((a, b) => a.rank - b.rank)),
        tap((p) => this.prizes.set(p)),
        catchError(() => {
          this.prizes$ = null;
          return of(null);
        }),
        shareReplay(1),
      );
    }
    return this.prizes$;
  }

  packByCode(code: string): PublicPack | undefined {
    return this.packs()?.find((p) => p.code === code);
  }
}
