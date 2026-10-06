import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { formatEuros } from '../../core/utils/format';

interface Day {
  date: string;
  orders: number;
  revenueCents: number;
  entries: number;
}

const W = 720;
const H = 230;
const M = { top: 12, right: 8, bottom: 26, left: 56 };

/** Ventes par jour : une serie, barres fines, infobulle au survol / focus, vue tableau. */
@Component({
  selector: 'app-daily-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="font-sans text-base font-semibold">Chiffre d’affaires par jour</h2>
      <button type="button" class="btn-ghost btn-sm" (click)="showTable.set(!showTable())" [attr.aria-pressed]="showTable()">
        {{ showTable() ? 'Voir le graphique' : 'Voir le tableau' }}
      </button>
    </div>
    @if (!days().length) {
      <p class="py-10 text-center text-sm text-ink-500">Aucune vente pour le moment.</p>
    } @else if (showTable()) {
      <div class="max-h-72 overflow-auto">
        <table class="table-admin">
          <thead><tr><th>Jour</th><th class="text-right">Commandes</th><th class="text-right">Participations</th><th class="text-right">CA</th></tr></thead>
          <tbody>
            @for (d of days(); track d.date) {
              <tr>
                <td>{{ label(d.date) }}</td>
                <td class="text-right tabular-nums">{{ d.orders }}</td>
                <td class="text-right tabular-nums">{{ d.entries }}</td>
                <td class="text-right tabular-nums">{{ euros(d.revenueCents) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="relative">
        <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" class="h-auto w-full" role="img" [attr.aria-label]="summary()">
          @for (t of ticks(); track t.value) {
            <line [attr.x1]="m.left" [attr.x2]="w - m.right" [attr.y1]="t.y" [attr.y2]="t.y" stroke="#EADBCB" stroke-width="1" />
            <text [attr.x]="m.left - 8" [attr.y]="t.y + 4" text-anchor="end" font-size="11" fill="#6B5C67">{{ t.label }}</text>
          }
          @for (b of bars(); track b.day.date; let i = $index) {
            <rect [attr.x]="b.hitX" [attr.y]="m.top" [attr.width]="b.hitW" [attr.height]="plotH" fill="transparent"
              (mouseenter)="hover.set(i)" (mouseleave)="hover.set(null)" />
            <path [attr.d]="b.path" [attr.fill]="hover() === i ? '#BF4C29' : '#D9603B'" pointer-events="none" />
          }
          @for (x of xLabels(); track x.label) {
            <text [attr.x]="x.x" [attr.y]="h - 8" text-anchor="middle" font-size="11" fill="#6B5C67">{{ x.label }}</text>
          }
          <line [attr.x1]="m.left" [attr.x2]="w - m.right" [attr.y1]="m.top + plotH" [attr.y2]="m.top + plotH" stroke="#B3A5AE" stroke-width="1" />
        </svg>
        @if (tooltip(); as t) {
          <div class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lift"
            [style.left.%]="t.leftPct" [style.top.%]="t.topPct">
            <p class="font-semibold text-ink">{{ t.label }}</p>
            <p class="text-ink-700">{{ t.revenue }} · {{ t.orders }} cmd · {{ t.entries }} part.</p>
          </div>
        }
      </div>
    }
  `,
})
export class DailyChartComponent {
  readonly days = input<Day[]>([]);
  readonly showTable = signal(false);
  readonly hover = signal<number | null>(null);

  readonly w = W;
  readonly h = H;
  readonly m = M;
  readonly plotH = H - M.top - M.bottom;
  private readonly plotW = W - M.left - M.right;

  readonly euros = (c: number) => formatEuros(c, true);

  label(date: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
    return m ? `${m[3]}/${m[2]}` : date;
  }

  private readonly max = computed(() => {
    const raw = Math.max(0, ...this.days().map((d) => d.revenueCents));
    if (raw === 0) {
      return 10000;
    }
    // Arrondi « joli » au-dessus : 1, 2, 5 x 10^n euros.
    const euros = raw / 100;
    const pow = Math.pow(10, Math.floor(Math.log10(euros)));
    const step = [1, 2, 5, 10].find((s) => s * pow >= euros) ?? 10;
    return step * pow * 100;
  });

  readonly ticks = computed(() =>
    [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      value: f,
      y: M.top + this.plotH * (1 - f),
      label: formatEuros(Math.round(this.max() * f), true),
    })),
  );

  readonly bars = computed(() => {
    const days = this.days();
    const band = this.plotW / Math.max(days.length, 1);
    const bw = Math.max(2, Math.min(22, band - 2));
    return days.map((day, i) => {
      const x = M.left + i * band + (band - bw) / 2;
      const hBar = (day.revenueCents / this.max()) * this.plotH;
      const y = M.top + this.plotH - hBar;
      const r = Math.min(4, bw / 2, hBar);
      const base = M.top + this.plotH;
      const path =
        hBar <= 0
          ? ''
          : `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${base} Z`;
      return { day, path, hitX: M.left + i * band, hitW: band, cx: x + bw / 2, top: y };
    });
  });

  readonly xLabels = computed(() => {
    const bars = this.bars();
    if (!bars.length) {
      return [];
    }
    const idx = Array.from(new Set([0, Math.floor((bars.length - 1) / 2), bars.length - 1]));
    return idx.map((i) => ({ x: bars[i].cx, label: this.label(bars[i].day.date) }));
  });

  readonly tooltip = computed(() => {
    const i = this.hover();
    if (i === null) {
      return null;
    }
    const b = this.bars()[i];
    if (!b) {
      return null;
    }
    return {
      leftPct: (b.cx / W) * 100,
      topPct: (Math.min(b.top, M.top + this.plotH - 4) / H) * 100,
      label: this.label(b.day.date),
      revenue: formatEuros(b.day.revenueCents),
      orders: b.day.orders,
      entries: b.day.entries,
    };
  });

  readonly summary = computed(() => {
    const days = this.days();
    const total = days.reduce((n, d) => n + d.revenueCents, 0);
    return `Chiffre d’affaires par jour sur ${days.length} jours, total ${formatEuros(total)}. Utilisez « Voir le tableau » pour le détail.`;
  });
}
