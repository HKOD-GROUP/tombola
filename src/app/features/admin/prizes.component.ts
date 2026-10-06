import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Upload } from 'lucide-angular';

import { AdminPrize } from '../../core/models/tombola.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { formatEuros } from '../../core/utils/format';
import { PrizeVisualComponent } from '../../shared/components/prize-visual.component';
import { centsToEurosInput, eurosToCents } from './admin-ui';

interface PrizeDraft {
  id: string | null;
  rank: number;
  name: string;
  description: string;
  value: string;
  imageUrl: string;
  active: boolean;
}

@Component({
  selector: 'app-admin-prizes',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PrizeVisualComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1>Lots</h1>
      @if (!draft()) {
        <button type="button" class="btn-primary btn-sm" (click)="edit(null)">
          <lucide-icon [img]="icPlus" [size]="16" aria-hidden="true" /> Ajouter un lot
        </button>
      }
    </div>
    @if (error()) {
      <p class="alert-error mb-4" role="alert">{{ error() }}</p>
    }

    @if (draft(); as d) {
      <form class="card mb-6 p-5" (ngSubmit)="save()">
        <h2 class="mb-4 font-sans text-base font-semibold">{{ d.id ? 'Modifier le lot' : 'Nouveau lot' }}</h2>
        <div class="grid gap-4 sm:grid-cols-[100px_1fr_140px]">
          <div>
            <label class="label" for="rank">Rang</label>
            <input id="rank" name="rank" type="number" min="1" class="input" [(ngModel)]="d.rank" required />
          </div>
          <div>
            <label class="label" for="pname">Nom</label>
            <input id="pname" name="name" class="input" [(ngModel)]="d.name" required />
          </div>
          <div>
            <label class="label" for="pvalue">Valeur (€)</label>
            <input id="pvalue" name="value" class="input" inputmode="decimal" [(ngModel)]="d.value" />
          </div>
          <div class="sm:col-span-3">
            <label class="label" for="pdesc">Description</label>
            <textarea id="pdesc" name="description" class="input min-h-[80px]" [(ngModel)]="d.description"></textarea>
          </div>
          <div class="sm:col-span-3">
            <label class="label" for="pimg">Image</label>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input id="pimg" name="imageUrl" class="input" [(ngModel)]="d.imageUrl" placeholder="https://…" />
              <label class="btn-secondary btn-sm shrink-0 cursor-pointer">
                <lucide-icon [img]="icUpload" [size]="15" aria-hidden="true" /> {{ uploading() ? 'Envoi…' : 'Téléverser' }}
                <input type="file" accept="image/*" class="sr-only" (change)="upload($event)" [disabled]="uploading()" />
              </label>
            </div>
            @if (d.imageUrl) {
              <img [src]="d.imageUrl" alt="Aperçu" class="mt-3 h-28 rounded-lg border border-line object-cover" />
            }
          </div>
          <label class="flex items-center gap-2 text-sm sm:col-span-3">
            <input type="checkbox" class="checkbox" name="active" [(ngModel)]="d.active" /> Visible sur le site
          </label>
        </div>
        <div class="mt-5 flex gap-2">
          <button type="submit" class="btn-primary btn-sm" [disabled]="busy()">Enregistrer</button>
          <button type="button" class="btn-secondary btn-sm" (click)="draft.set(null)">Annuler</button>
        </div>
      </form>
    }

    <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      @for (p of prizes(); track p.id) {
        <li class="card overflow-hidden" [class.opacity-60]="!p.active">
          <app-prize-visual class="aspect-[3/2]" [imageUrl]="p.imageUrl" [name]="p.name" [rank]="p.rank" />
          <div class="p-4">
            <p class="text-xs text-ink-500">Lot n°{{ p.rank }} {{ p.active ? '' : '· masqué' }}</p>
            <h2 class="font-sans text-base font-semibold">{{ p.name }}</h2>
            @if (p.valueCents) { <p class="text-sm text-ink-600">{{ euros(p.valueCents) }}</p> }
            <div class="mt-3 flex flex-wrap gap-2">
              @if (confirmDelete() === p.id) {
                <span class="w-full text-sm text-[#912018]">Supprimer ce lot ?</span>
                <button type="button" class="btn-danger btn-sm" [disabled]="busy()" (click)="remove(p)">Supprimer</button>
                <button type="button" class="btn-secondary btn-sm" (click)="confirmDelete.set(null)">Annuler</button>
              } @else {
                <button type="button" class="btn-secondary btn-sm" (click)="edit(p)">Modifier</button>
                <button type="button" class="btn-ghost btn-sm" (click)="confirmDelete.set(p.id)">Supprimer</button>
              }
            </div>
          </div>
        </li>
      } @empty {
        <li class="text-sm text-ink-500">Aucun lot.</li>
      }
    </ul>
  `,
})
export class AdminPrizesComponent {
  private readonly api = inject(AdminApiService);
  readonly icPlus = Plus;
  readonly icUpload = Upload;
  readonly euros = (c: number) => formatEuros(c);

  readonly prizes = signal<AdminPrize[]>([]);
  readonly draft = signal<PrizeDraft | null>(null);
  readonly confirmDelete = signal<string | null>(null);
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.prizes().subscribe({
      next: (p) => this.prizes.set([...p].sort((a, b) => a.rank - b.rank)),
      error: (err: unknown) => this.error.set(parseApiError(err, 'Lots indisponibles.').message),
    });
  }

  edit(p: AdminPrize | null): void {
    this.error.set(null);
    this.draft.set(
      p
        ? { id: p.id, rank: p.rank, name: p.name, description: p.description ?? '', value: centsToEurosInput(p.valueCents), imageUrl: p.imageUrl ?? '', active: p.active }
        : { id: null, rank: (this.prizes().at(-1)?.rank ?? 0) + 1, name: '', description: '', value: '', imageUrl: '', active: true },
    );
  }

  upload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.api.upload(file).subscribe({
      next: ({ url }) => {
        this.uploading.set(false);
        const d = this.draft();
        if (d) {
          this.draft.set({ ...d, imageUrl: url });
        }
      },
      error: (err: unknown) => {
        this.uploading.set(false);
        this.error.set(parseApiError(err, 'Téléversement impossible.').message);
      },
    });
  }

  save(): void {
    const d = this.draft();
    if (!d) {
      return;
    }
    if (!d.name.trim() || !(d.rank >= 1)) {
      this.error.set('Le nom et le rang (≥ 1) sont obligatoires.');
      return;
    }
    const body = {
      rank: Math.floor(d.rank),
      name: d.name.trim(),
      description: d.description.trim(),
      valueCents: eurosToCents(d.value),
      imageUrl: d.imageUrl.trim() || null,
      active: d.active,
    };
    this.busy.set(true);
    const call = d.id ? this.api.updatePrize(d.id, body) : this.api.createPrize(body);
    call.subscribe({
      next: () => {
        this.busy.set(false);
        this.draft.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(parseApiError(err, 'Enregistrement impossible.').message);
      },
    });
  }

  remove(p: AdminPrize): void {
    this.busy.set(true);
    this.api.deletePrize(p.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmDelete.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.error.set(parseApiError(err, 'Suppression impossible.').message);
      },
    });
  }
}
