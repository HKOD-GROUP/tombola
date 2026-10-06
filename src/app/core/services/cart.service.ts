import { Injectable, computed, signal } from '@angular/core';

import { PublicPack, TSHIRT_SIZES, TshirtSize } from '../models/tombola.models';

/** Une ligne du panier : un pack, ses tailles de t-shirts, une quantite. */
export interface CartLine {
  /** `PACK_80|M,L` : deux unites aux memes tailles partagent la ligne. */
  key: string;
  packCode: string;
  tshirtSizes: TshirtSize[];
  quantity: number;
}

export const MAX_PACKS_PER_ORDER = 50;
const STORAGE_KEY = 'tombola_cart_v1';
const PENDING_KEY = 'tombola_pending_order_v1';

export interface PendingOrder {
  reference: string;
  expiresAt: string;
}

function lineKey(packCode: string, sizes: readonly string[]): string {
  return `${packCode}|${sizes.join(',')}`;
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Panier persiste dans `localStorage` (try/catch : navigation privee, stockage
 * bloque). SSR-safe : rien n'est lu cote serveur ; les composants appellent
 * `restore()` apres le premier rendu navigateur.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSignal = signal<CartLine[]>([]);
  private restored = false;

  readonly lines = this.linesSignal.asReadonly();
  readonly count = computed(() => this.linesSignal().reduce((n, l) => n + l.quantity, 0));
  readonly isEmpty = computed(() => this.count() === 0);

  restore(): void {
    if (this.restored) {
      return;
    }
    this.restored = true;
    const storage = safeStorage();
    if (!storage) {
      return;
    }
    try {
      const raw = storage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(parsed)) {
        const lines: CartLine[] = [];
        for (const item of parsed) {
          const l = item as Partial<CartLine>;
          if (typeof l.packCode !== 'string' || typeof l.quantity !== 'number' || l.quantity < 1) {
            continue;
          }
          const sizes = (Array.isArray(l.tshirtSizes) ? l.tshirtSizes : []).filter((s): s is TshirtSize =>
            TSHIRT_SIZES.includes(s as TshirtSize),
          );
          lines.push({ key: lineKey(l.packCode, sizes), packCode: l.packCode, tshirtSizes: sizes, quantity: Math.floor(l.quantity) });
        }
        this.linesSignal.set(lines);
      }
    } catch {
      // Contenu illisible : on repart d'un panier vide.
    }
  }

  /** Ajoute `quantity` packs ; renvoie le nombre reellement ajoute (plafond 50). */
  add(packCode: string, tshirtSizes: TshirtSize[], quantity = 1): number {
    const room = MAX_PACKS_PER_ORDER - this.count();
    const n = Math.max(0, Math.min(quantity, room));
    if (n === 0) {
      return 0;
    }
    const key = lineKey(packCode, tshirtSizes);
    const lines = [...this.linesSignal()];
    const existing = lines.findIndex((l) => l.key === key);
    if (existing >= 0) {
      lines[existing] = { ...lines[existing], quantity: lines[existing].quantity + n };
    } else {
      lines.push({ key, packCode, tshirtSizes: [...tshirtSizes], quantity: n });
    }
    this.commit(lines);
    return n;
  }

  setQuantity(key: string, quantity: number): void {
    const others = this.count() - (this.linesSignal().find((l) => l.key === key)?.quantity ?? 0);
    const q = Math.max(0, Math.min(Math.floor(quantity), MAX_PACKS_PER_ORDER - others));
    const lines = this.linesSignal()
      .map((l) => (l.key === key ? { ...l, quantity: q } : l))
      .filter((l) => l.quantity > 0);
    this.commit(lines);
  }

  remove(key: string): void {
    this.commit(this.linesSignal().filter((l) => l.key !== key));
  }

  clear(): void {
    this.commit([]);
  }

  /** Retire les lignes dont le pack n'existe plus / n'est plus actif. */
  prune(packs: readonly PublicPack[]): void {
    const codes = new Set(packs.map((p) => p.code));
    const kept = this.linesSignal().filter((l) => codes.has(l.packCode));
    if (kept.length !== this.linesSignal().length) {
      this.commit(kept);
    }
  }

  /** Items de `POST /public/orders/checkout` : une entree par pack (quantite depliee). */
  toCheckoutItems(): { packCode: string; tshirtSizes: TshirtSize[] }[] {
    return this.linesSignal().flatMap((l) =>
      Array.from({ length: l.quantity }, () => ({ packCode: l.packCode, tshirtSizes: [...l.tshirtSizes] })),
    );
  }

  /* ---------- Commande en attente de paiement (reprise) ---------- */

  getPendingOrder(): PendingOrder | null {
    const storage = safeStorage();
    try {
      const raw = storage?.getItem(PENDING_KEY);
      const p = raw ? (JSON.parse(raw) as PendingOrder) : null;
      if (p && typeof p.reference === 'string' && new Date(p.expiresAt).getTime() > Date.now()) {
        return p;
      }
    } catch {
      // ignore
    }
    return null;
  }

  setPendingOrder(order: PendingOrder | null): void {
    const storage = safeStorage();
    try {
      if (order) {
        storage?.setItem(PENDING_KEY, JSON.stringify(order));
      } else {
        storage?.removeItem(PENDING_KEY);
      }
    } catch {
      // ignore
    }
  }

  private commit(lines: CartLine[]): void {
    this.linesSignal.set(lines);
    const storage = safeStorage();
    try {
      storage?.setItem(
        STORAGE_KEY,
        JSON.stringify(lines.map(({ packCode, tshirtSizes, quantity }) => ({ packCode, tshirtSizes, quantity }))),
      );
    } catch {
      // Quota depasse / stockage bloque : le panier reste en memoire.
    }
  }
}
