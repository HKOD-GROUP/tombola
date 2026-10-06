/**
 * Illustrations vectorielles des articles (placeholders en attendant les
 * photos) : chaque forme est dessinee dans une boite 100 x 100.
 */
export type ItemKind = 'KEYCHAIN' | 'TSHIRT' | 'CAP';

export const ITEM_FILL: Record<ItemKind, string[]> = {
  KEYCHAIN: ['#141416'],
  TSHIRT: ['#141416', '#3F3F46'],
  CAP: ['#27272A'],
};

export interface ShapeLayer {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export function itemLayers(kind: ItemKind, color: string): ShapeLayer[] {
  switch (kind) {
    case 'TSHIRT':
      return [
        { d: 'M31 16 L42 11 Q50 19 58 11 L69 16 L88 31 L78 45 L69 39 L69 88 L31 88 L31 39 L22 45 L12 31 Z', fill: color },
        { d: 'M42 11 Q50 19 58 11', stroke: '#FFFFFF', strokeWidth: 2.5, opacity: 0.55 },
        { d: 'M40 52 a10 10 0 1 1 20 0 c0 7-10 13-10 13s-10-6-10-13Z', fill: '#FFFFFF', opacity: 0.9 },
      ];
    case 'CAP':
      return [
        { d: 'M14 64 Q14 30 50 28 Q84 30 84 62 Z', fill: color },
        { d: 'M50 28 Q38 40 36 64', stroke: '#FFFFFF', strokeWidth: 2, opacity: 0.45 },
        { d: 'M50 28 Q62 40 64 63', stroke: '#FFFFFF', strokeWidth: 2, opacity: 0.45 },
        { d: 'M12 62 L84 62 Q98 64 96 72 Q90 78 70 74 L12 68 Z', fill: '#000000' },
        { d: 'M47 27 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0', fill: '#000000' },
      ];
    case 'KEYCHAIN':
    default:
      return [
        { d: 'M24 26 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', stroke: '#A1A1AA', strokeWidth: 4 },
        { d: 'M45 36 L50 46', stroke: '#A1A1AA', strokeWidth: 4 },
        { d: 'M40 46 h28 a8 8 0 0 1 8 8 v24 a8 8 0 0 1 -8 8 h-28 a8 8 0 0 1 -8 -8 v-24 a8 8 0 0 1 8 -8 Z', fill: color },
        { d: 'M54 76 s-11-6.5-11-14 a5.5 5.5 0 0 1 11-2.6 a5.5 5.5 0 0 1 11 2.6 c0 7.5-11 14-11 14Z', fill: '#FFFFFF' },
      ];
  }
}
