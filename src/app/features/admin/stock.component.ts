import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminPack, AdminStockItem } from '../../core/models/tombola.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { centsToEurosInput, eurosToCents } from './admin-ui';

interface PackDraft {
  name: string;
  description: string;
  price: string;
  chances: number;
  active: boolean;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-stock',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-5">Stock &amp; packs</h1>
    @if (error()) {
      <p class="alert-error mb-4" role="alert">{{ error() }}</p>
    }
    @if (notice()) {
      <p class="alert-success mb-4" role="status">{{ notice() }}</p>
    }

    <section class="card mb-6 overflow-x-auto p-5">
      <h2 class="mb-1 font-sans text-base font-semibold">Stock par article</h2>
      <p class="mb-4 text-sm text-ink-500">« Disponible » = stock vendable ; « Réservé » = articles bloqués par des commandes en attente de paiement (30 min).</p>
      <table class="table-admin min-w-[520px]">
        <thead><tr><th>Article</th><th>SKU</th><th class="text-right">Réservé</th><th>Disponible</th><th></th></tr></thead>
        <tbody>
          @for (s of stock(); track s.sku) {
            <tr>
              <td>{{ s.label }}</td>
              <td class="font-mono text-xs text-ink-500">{{ s.sku }}</td>
              <td class="text-right tabular-nums">{{ s.reserved }}</td>
              <td>
                <label class="sr-only" [for]="'stock-' + s.sku">Stock {{ s.label }}</label>
                <input [id]="'stock-' + s.sku" type="number" min="0" step="1" class="input w-28 py-1.5" [class.!border-flame-500]="stockDrafts()[s.sku] !== s.stock"
                  [ngModel]="stockDrafts()[s.sku]" (ngModelChange)="setStockDraft(s.sku, $event)" />
              </td>
              <td>
                <button type="button" class="btn-secondary btn-sm" [disabled]="stockDrafts()[s.sku] === s.stock || saving() === s.sku" (click)="saveStock(s)">
                  Enregistrer
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="py-6 text-center text-ink-500">Chargement…</td></tr>
          }
        </tbody>
      </table>
    </section>

    <section class="card p-5">
      <h2 class="mb-1 font-sans text-base font-semibold">Packs</h2>
      <p class="mb-4 text-sm text-ink-500">Les modifications s’appliquent aux nouvelles commandes ; les commandes passées conservent leur prix.</p>
      <div class="space-y-4">
        @for (p of packs(); track p.code) {
          @let d = packDrafts()[p.code];
          @if (d) {
            <form class="rounded-xl border border-line p-4" (ngSubmit)="savePack(p)">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p class="font-mono text-xs text-ink-500">{{ p.code }}
                  @if (p.components?.length) {
                    · {{ componentsLabel(p) }}
                  }
                </p>
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" class="checkbox" [name]="'active-' + p.code" [(ngModel)]="d.active" /> Actif (visible en boutique)
                </label>
              </div>
              <div class="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
                <div>
                  <label class="label" [for]="'name-' + p.code">Nom</label>
                  <input class="input" [id]="'name-' + p.code" [name]="'name-' + p.code" [(ngModel)]="d.name" required />
                </div>
                <div>
                  <label class="label" [for]="'price-' + p.code">Prix (€)</label>
                  <input class="input" [id]="'price-' + p.code" [name]="'price-' + p.code" inputmode="decimal" [(ngModel)]="d.price" required />
                </div>
                <div>
                  <label class="label" [for]="'chances-' + p.code">Participations</label>
                  <input class="input" type="number" min="1" [id]="'chances-' + p.code" [name]="'chances-' + p.code" [(ngModel)]="d.chances" required />
                </div>
                <div class="sm:col-span-3">
                  <label class="label" [for]="'desc-' + p.code">Description</label>
                  <textarea class="input min-h-[70px]" [id]="'desc-' + p.code" [name]="'desc-' + p.code" [(ngModel)]="d.description"></textarea>
                </div>
                <div class="sm:col-span-3">
                  <label class="label" [for]="'img-' + p.code">URL de l’image (facultatif)</label>
                  <input class="input" [id]="'img-' + p.code" [name]="'img-' + p.code" [(ngModel)]="d.imageUrl" placeholder="https://…" />
                </div>
              </div>
              <button type="submit" class="btn-primary btn-sm mt-3" [disabled]="saving() === p.code">Enregistrer le pack</button>
            </form>
          }
        }
      </div>
    </section>
  `,
})
export class AdminStockComponent {
  private readonly api = inject(AdminApiService);
  readonly stock = signal<AdminStockItem[]>([]);
  readonly packs = signal<AdminPack[]>([]);
  readonly stockDrafts = signal<Record<string, number>>({});
  readonly packDrafts = signal<Record<string, PackDraft>>({});
  readonly saving = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  constructor() {
    this.loadStock();
    this.api.packs().subscribe({
      next: (packs) => {
        this.packs.set(packs);
        const drafts: Record<string, PackDraft> = {};
        for (const p of packs) {
          drafts[p.code] = {
            name: p.name,
            description: p.description ?? '',
            price: centsToEurosInput(p.priceCents),
            chances: p.chances,
            active: p.active,
            imageUrl: p.imageUrl ?? '',
          };
        }
        this.packDrafts.set(drafts);
      },
      error: (err: unknown) => this.error.set(parseApiError(err, 'Packs indisponibles.').message),
    });
  }

  componentsLabel(p: AdminPack): string {
    return (p.components ?? []).map((c) => `${c.quantity} × ${c.label}`).join(', ');
  }

  private loadStock(): void {
    this.api.stock().subscribe({
      next: (s) => {
        this.stock.set(s);
        this.stockDrafts.set(Object.fromEntries(s.map((i) => [i.sku, i.stock])));
      },
      error: (err: unknown) => this.error.set(parseApiError(err, 'Stock indisponible.').message),
    });
  }

  setStockDraft(sku: string, value: number | string): void {
    this.stockDrafts.update((m) => ({ ...m, [sku]: Number(value) }));
  }

  saveStock(item: AdminStockItem): void {
    const value = this.stockDrafts()[item.sku];
    if (!Number.isInteger(value) || value < 0) {
      this.error.set('Le stock doit être un nombre entier positif.');
      return;
    }
    this.flash(null);
    this.saving.set(item.sku);
    this.api.updateStock(item.sku, value).subscribe({
      next: () => {
        this.saving.set(null);
        this.stock.update((list) => list.map((s) => (s.sku === item.sku ? { ...s, stock: value } : s)));
        this.flash(`Stock « ${item.label} » mis à jour.`);
      },
      error: (err: unknown) => {
        this.saving.set(null);
        this.error.set(parseApiError(err, 'Mise à jour impossible.').message);
      },
    });
  }

  savePack(pack: AdminPack): void {
    const d = this.packDrafts()[pack.code];
    const priceCents = eurosToCents(d.price);
    if (priceCents === null || priceCents <= 0 || !d.name.trim() || !(d.chances >= 1)) {
      this.error.set('Vérifiez le nom, le prix et le nombre de participations du pack.');
      return;
    }
    this.flash(null);
    this.saving.set(pack.code);
    this.api
      .updatePack(pack.code, {
        name: d.name.trim(),
        description: d.description.trim(),
        priceCents,
        chances: Math.floor(d.chances),
        active: d.active,
        imageUrl: d.imageUrl.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(null);
          this.flash(`Pack « ${d.name} » enregistré.`);
        },
        error: (err: unknown) => {
          this.saving.set(null);
          this.error.set(parseApiError(err, 'Enregistrement impossible.').message);
        },
      });
  }

  private flash(message: string | null): void {
    this.error.set(null);
    this.notice.set(message);
  }
}
