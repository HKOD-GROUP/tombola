import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminSettings, GameStatus } from '../../core/models/tombola.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { parseApiError } from '../../core/utils/api-error';
import { isoToParisLocalInput, parisLocalInputToIso } from '../../core/utils/format';
import { centsToEurosInput, eurosToCents } from './admin-ui';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-1">Réglages</h1>
    <p class="mb-5 text-sm text-ink-500">Dates saisies en heure de Paris. Ces informations alimentent le site, le règlement et les e-mails.</p>
    @if (error()) {
      <p class="alert-error mb-4" role="alert">{{ error() }}</p>
    }
    @if (notice()) {
      <p class="alert-success mb-4" role="status">{{ notice() }}</p>
    }
    @if (closed()) {
      <p class="alert-info mb-4">Le jeu est clôturé : le statut ne peut plus être modifié ici.</p>
    }

    <form [formGroup]="form" (ngSubmit)="save()" class="space-y-5" novalidate>
      <section class="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 class="font-sans text-base font-semibold sm:col-span-2">Le jeu</h2>
        <div>
          <label class="label" for="gameName">Nom du jeu</label>
          <input id="gameName" class="input" formControlName="gameName" />
        </div>
        <div>
          <label class="label" for="status">Statut</label>
          <select id="status" class="input" formControlName="status">
            <option value="DRAFT">Brouillon (commandes fermées)</option>
            <option value="OPEN">Ouvert</option>
            @if (closed()) { <option value="CLOSED">Clôturé</option> }
          </select>
        </div>
        <div>
          <label class="label" for="startAt">Ouverture</label>
          <input id="startAt" type="datetime-local" class="input" formControlName="startAt" />
        </div>
        <div>
          <label class="label" for="endAt">Fin des commandes</label>
          <input id="endAt" type="datetime-local" class="input" formControlName="endAt" />
        </div>
        <div>
          <label class="label" for="drawAt">Date du tirage <span class="font-normal text-ink-500">(facultatif)</span></label>
          <input id="drawAt" type="datetime-local" class="input" formControlName="drawAt" />
        </div>
        <div>
          <label class="label" for="shippingFee">Frais de livraison (€ par commande)</label>
          <input id="shippingFee" class="input" inputmode="decimal" formControlName="shippingFee" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="rulesUrl">URL du règlement (PDF) <span class="font-normal text-ink-500">(facultatif)</span></label>
          <input id="rulesUrl" class="input" formControlName="rulesUrl" placeholder="https://…" />
        </div>
      </section>

      <section class="card grid gap-4 p-5 sm:grid-cols-[1fr_160px]">
        <h2 class="font-sans text-base font-semibold sm:col-span-2">Association</h2>
        <div>
          <label class="label" for="associationName">Nom</label>
          <input id="associationName" class="input" formControlName="associationName" />
        </div>
        <div>
          <label class="label" for="associationPercent">Pourcentage reversé</label>
          <input id="associationPercent" type="number" min="0" max="100" class="input" formControlName="associationPercent" />
        </div>
      </section>

      <section class="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 class="font-sans text-base font-semibold sm:col-span-2">Organisateur et commissaire de justice</h2>
        <div>
          <label class="label" for="organizerName">Organisateur</label>
          <input id="organizerName" class="input" formControlName="organizerName" />
        </div>
        <div>
          <label class="label" for="bailiffName">Commissaire de justice</label>
          <input id="bailiffName" class="input" formControlName="bailiffName" />
        </div>
        <div>
          <label class="label" for="organizerDetails">Détails organisateur</label>
          <textarea id="organizerDetails" class="input min-h-[110px]" formControlName="organizerDetails" placeholder="Forme juridique, capital, RCS, SIRET, adresse…"></textarea>
        </div>
        <div>
          <label class="label" for="bailiffDetails">Détails commissaire de justice</label>
          <textarea id="bailiffDetails" class="input min-h-[110px]" formControlName="bailiffDetails" placeholder="Étude, adresse…"></textarea>
        </div>
      </section>

      <button type="submit" class="btn-primary" [disabled]="busy() || !loaded()">Enregistrer les réglages</button>
    </form>
  `,
})
export class AdminSettingsComponent {
  private readonly api = inject(AdminApiService);
  readonly form = inject(FormBuilder).nonNullable.group({
    gameName: ['', Validators.required],
    status: ['DRAFT' as GameStatus],
    startAt: ['', Validators.required],
    endAt: ['', Validators.required],
    drawAt: [''],
    shippingFee: ['', Validators.required],
    rulesUrl: [''],
    associationName: ['', Validators.required],
    associationPercent: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    organizerName: [''],
    organizerDetails: [''],
    bailiffName: [''],
    bailiffDetails: [''],
  });
  readonly loaded = signal(false);
  readonly closed = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  constructor() {
    this.api.settings().subscribe({
      next: (s) => this.fill(s),
      error: (err: unknown) => this.error.set(parseApiError(err, 'Réglages indisponibles.').message),
    });
  }

  private fill(s: AdminSettings): void {
    this.closed.set(s.status === 'CLOSED');
    this.form.reset({
      gameName: s.gameName,
      status: s.status,
      startAt: isoToParisLocalInput(s.startAt),
      endAt: isoToParisLocalInput(s.endAt),
      drawAt: isoToParisLocalInput(s.drawAt),
      shippingFee: centsToEurosInput(s.shippingFeeCents),
      rulesUrl: s.rulesUrl ?? '',
      associationName: s.associationName,
      associationPercent: s.associationPercent,
      organizerName: s.organizerName ?? '',
      organizerDetails: s.organizerDetails ?? '',
      bailiffName: s.bailiffName ?? '',
      bailiffDetails: s.bailiffDetails ?? '',
    });
    if (s.status === 'CLOSED') {
      this.form.controls.status.disable();
    }
    this.loaded.set(true);
  }

  save(): void {
    this.error.set(null);
    this.notice.set(null);
    const v = this.form.getRawValue();
    const startAt = parisLocalInputToIso(v.startAt);
    const endAt = parisLocalInputToIso(v.endAt);
    const shippingFeeCents = eurosToCents(v.shippingFee);
    if (this.form.invalid || !startAt || !endAt || shippingFeeCents === null) {
      this.form.markAllAsTouched();
      this.error.set('Vérifiez les champs obligatoires (nom, dates, frais de livraison, association).');
      return;
    }
    if (endAt <= startAt) {
      this.error.set('La fin des commandes doit être postérieure à l’ouverture.');
      return;
    }
    this.busy.set(true);
    this.api
      .updateSettings({
        gameName: v.gameName.trim(),
        status: v.status,
        startAt,
        endAt,
        drawAt: parisLocalInputToIso(v.drawAt),
        shippingFeeCents,
        associationPercent: Number(v.associationPercent),
        associationName: v.associationName.trim(),
        organizerName: v.organizerName.trim(),
        organizerDetails: v.organizerDetails.trim(),
        bailiffName: v.bailiffName.trim(),
        bailiffDetails: v.bailiffDetails.trim(),
        rulesUrl: v.rulesUrl.trim() || null,
      })
      .subscribe({
        next: (s) => {
          this.busy.set(false);
          if (s) {
            this.fill(s);
          }
          this.notice.set('Réglages enregistrés.');
        },
        error: (err: unknown) => {
          this.busy.set(false);
          this.error.set(parseApiError(err, 'Enregistrement impossible.').message);
        },
      });
  }
}
