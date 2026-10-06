import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, input, signal } from '@angular/core';

import { PublicGame } from '../../core/models/tombola.models';
import { formatDateTimeLong } from '../../core/utils/format';

/**
 * Bandeau du compte a rebours (sous l'en-tete) : « Début du jeu dans » avant
 * `startAt`, « Fin du jeu dans » jusqu'a `endAt`, puis « Jeu terminé ».
 * La barre montre la part ecoulee de la duree du jeu. L'horloge ne tourne que
 * dans le navigateur.
 */
@Component({
  selector: 'app-countdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (game(); as g) {
      <div class="mx-auto flex max-w-[360px] flex-col items-center px-4 pb-3 pt-2 text-white">
        @if (phase() === 'ended') {
          <p class="font-display text-[15px] font-extrabold uppercase italic">Jeu terminé</p>
          <p class="text-xs text-white/70">Merci à toutes et à tous ! Le tirage est réalisé par le commissaire de justice.</p>
        } @else {
          <p class="text-[12.5px] font-semibold leading-4">{{ phase() === 'before' ? 'Début du jeu dans :' : 'Fin du jeu dans :' }}</p>
          <p class="mt-0.5 font-display text-[22px] font-extrabold leading-7 tabular-nums" role="timer" [attr.aria-label]="ariaLabel()">
            @for (u of units(); track u.unit; let last = $last) {
              <span aria-hidden="true">{{ u.value }}<span class="text-[12px] font-bold">{{ u.unit }}</span></span>
              @if (!last) {
                <span class="mx-1.5 text-white/90" aria-hidden="true">—</span>
              }
            }
          </p>
          <span class="sr-only">{{ phase() === 'before' ? 'Ouverture le' : 'Fin des commandes le' }} {{ targetLabel() }}</span>
        }
        <div
          class="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-white/25"
          role="progressbar"
          aria-label="Durée du jeu écoulée"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="progress()"
        >
          <div class="h-full rounded-full bg-white transition-[width] duration-1000" [style.width.%]="progress()"></div>
        </div>
      </div>
    }
  `,
})
export class CountdownComponent {
  readonly game = input<PublicGame | null>(null);
  private readonly now = signal(Date.now());

  readonly phase = computed<'before' | 'running' | 'ended'>(() => {
    const g = this.game();
    if (!g) {
      return 'ended';
    }
    const now = this.now();
    if (g.status === 'CLOSED' || now >= new Date(g.endAt).getTime()) {
      return 'ended';
    }
    return now < new Date(g.startAt).getTime() ? 'before' : 'running';
  });

  readonly target = computed(() => {
    const g = this.game();
    return g ? (this.phase() === 'before' ? g.startAt : g.endAt) : null;
  });

  readonly targetLabel = computed(() => formatDateTimeLong(this.target()));

  /** Part ecoulee (0-100) de la duree startAt -> endAt. */
  readonly progress = computed(() => {
    const g = this.game();
    if (!g) {
      return 0;
    }
    const start = new Date(g.startAt).getTime();
    const end = new Date(g.endAt).getTime();
    if (this.phase() === 'ended') {
      return 100;
    }
    if (!(end > start)) {
      return 0;
    }
    return Math.round(Math.min(100, Math.max(0, ((this.now() - start) / (end - start)) * 100)));
  });

  private readonly remaining = computed(() => {
    const t = this.target();
    const ms = t ? Math.max(0, new Date(t).getTime() - this.now()) : 0;
    const s = Math.floor(ms / 1000);
    return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
  });

  readonly units = computed(() => {
    const r = this.remaining();
    const pad = (n: number) => String(n).padStart(2, '0');
    return [
      { value: String(r.days), unit: 'J' },
      { value: pad(r.hours), unit: 'H' },
      { value: pad(r.minutes), unit: 'MN' },
      { value: pad(r.seconds), unit: 'S' },
    ];
  });

  readonly ariaLabel = computed(() => {
    const r = this.remaining();
    return `${this.phase() === 'before' ? 'Début du jeu dans' : 'Fin du jeu dans'} ${r.days} jours, ${r.hours} heures et ${r.minutes} minutes`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const id = setInterval(() => this.now.set(Date.now()), 1000);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }
}
