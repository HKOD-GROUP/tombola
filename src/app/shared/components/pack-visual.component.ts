import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { PackComponent } from '../../core/models/tombola.models';
import { ITEM_FILL, ItemKind, ShapeLayer, itemLayers } from './item-shapes';

interface PlacedItem {
  transform: string;
  layers: ShapeLayer[];
}

const BACKGROUNDS = ['#F4F4F5', '#ECECEE', '#F4F4F5', '#ECECEE'];

/**
 * Visuel d'un pack : photo si `imageUrl`, sinon illustration SVG composee
 * des articles du pack (porte-cles, t-shirts, casquette).
 */
@Component({
  selector: 'app-pack-visual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imageUrl()) {
      <img [src]="imageUrl()" [alt]="alt()" class="h-full w-full object-cover" loading="lazy" />
    } @else {
      <svg viewBox="0 0 320 200" class="h-full w-full" role="img" [attr.aria-label]="alt()" preserveAspectRatio="xMidYMid slice">
        <rect width="320" height="200" [attr.fill]="background()" />
        <circle cx="270" cy="34" r="46" fill="#FFFFFF" opacity="0.35" />
        <circle cx="40" cy="180" r="60" fill="#FFFFFF" opacity="0.3" />
        @for (item of items(); track $index) {
          <g [attr.transform]="item.transform">
            @for (l of item.layers; track $index) {
              <path
                [attr.d]="l.d"
                [attr.fill]="l.fill ?? 'none'"
                [attr.stroke]="l.stroke ?? null"
                [attr.stroke-width]="l.strokeWidth ?? null"
                [attr.opacity]="l.opacity ?? null"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            }
          </g>
        }
      </svg>
    }
  `,
  host: { class: 'block overflow-hidden' },
})
export class PackVisualComponent {
  readonly components = input<PackComponent[]>([]);
  readonly imageUrl = input<string | null>(null);
  readonly name = input('Pack');
  readonly index = input(0);

  readonly alt = computed(() => {
    const parts = this.components().map((c) => `${c.quantity > 1 ? c.quantity + ' × ' : ''}${c.label.toLowerCase()}`);
    return `${this.name()} : ${parts.join(', ')}`;
  });

  readonly background = computed(() => BACKGROUNDS[this.index() % BACKGROUNDS.length]);

  readonly items = computed<PlacedItem[]>(() => {
    const order: ItemKind[] = ['TSHIRT', 'CAP', 'KEYCHAIN'];
    const kinds: ItemKind[] = [];
    for (const kind of order) {
      const qty = this.components()
        .filter((c) => c.kind === kind)
        .reduce((n, c) => n + c.quantity, 0);
      for (let i = 0; i < qty; i++) {
        kinds.push(kind);
      }
    }
    if (kinds.length === 0) {
      kinds.push('KEYCHAIN');
    }
    const n = kinds.length;
    const scale = n === 1 ? 1.25 : n === 2 ? 1.1 : n === 3 ? 0.92 : 0.74;
    const size = 100 * scale;
    const gap = n >= 4 ? -2 : 6;
    const total = n * size + (n - 1) * gap;
    const startX = (320 - total) / 2;
    const y = (200 - size) / 2 + 4;
    const counters: Record<string, number> = {};
    return kinds.map((kind, i) => {
      const k = counters[kind] ?? 0;
      counters[kind] = k + 1;
      const palette = ITEM_FILL[kind];
      const x = startX + i * (size + gap);
      return {
        transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale})`,
        layers: itemLayers(kind, palette[k % palette.length]),
      };
    });
  });
}
