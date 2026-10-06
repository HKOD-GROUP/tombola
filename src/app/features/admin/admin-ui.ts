import { OrderStatus, ShippingStatus } from '../../core/models/tombola.models';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'En attente',
  PAID: 'Payée',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const ORDER_STATUS_BADGES: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'badge-todo',
  PAID: 'badge-go',
  EXPIRED: 'badge-ink',
  CANCELLED: 'badge-ink',
  REFUNDED: 'badge-danger',
};

export const SHIPPING_LABELS: Record<ShippingStatus, string> = {
  TO_SHIP: 'À expédier',
  SHIPPED: 'Expédiée',
};

/** « 49,90 » (saisie en euros) -> 4990 centimes ; `null` si invalide. */
export function eurosToCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** 4990 -> « 49.90 » pour un champ de saisie. */
export function centsToEurosInput(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? '' : (cents / 100).toFixed(2);
}
