import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONES = [
  { bg: '#1B1B1E', box: '#FFFFFF', ribbon: '#FD5501' },
  { bg: '#27272A', box: '#E4E4E7', ribbon: '#141416' },
  { bg: '#1B1B1E', box: '#A1A1AA', ribbon: '#FFFFFF' },
];

/** Visuel d'un lot : photo si disponible, sinon paquet cadeau numerote. */
@Component({
  selector: 'app-prize-visual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (imageUrl()) {
      <img [src]="imageUrl()" [alt]="name()" class="h-full w-full object-cover" loading="lazy" />
    } @else {
      <svg viewBox="0 0 240 160" class="h-full w-full" role="img" [attr.aria-label]="name()" preserveAspectRatio="xMidYMid slice">
        <rect width="240" height="160" [attr.fill]="tone().bg" />
        <circle cx="200" cy="30" r="34" fill="#fff" opacity="0.06" />
        <g transform="translate(78 34)">
          <path d="M42 18 C30 2 12 6 18 16 C22 22 34 20 42 18 Z" [attr.fill]="tone().ribbon" />
          <path d="M42 18 C54 2 72 6 66 16 C62 22 50 20 42 18 Z" [attr.fill]="tone().ribbon" />
          <rect x="2" y="18" width="80" height="22" rx="4" [attr.fill]="tone().box" />
          <rect x="8" y="40" width="68" height="52" rx="4" [attr.fill]="tone().box" opacity="0.85" />
          <rect x="36" y="18" width="12" height="74" [attr.fill]="tone().ribbon" />
        </g>
        <text x="20" y="140" font-family="Mona Sans, Inter, sans-serif" font-size="22" font-weight="800" font-style="italic" fill="#FFFFFF">
          n°{{ rank() }}
        </text>
      </svg>
    }
  `,
  host: { class: 'block overflow-hidden' },
})
export class PrizeVisualComponent {
  readonly imageUrl = input<string | null>(null);
  readonly name = input('Lot');
  readonly rank = input(1);
  readonly tone = computed(() => TONES[(Math.max(1, this.rank()) - 1) % TONES.length]);
}
