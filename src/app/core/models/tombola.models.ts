/**
 * Modeles de l'API Tombola (`/api/v1/tombola`), calques sur le contrat
 * `feat-tombola-v1-contract.md`. Montants en centimes, dates ISO-8601 UTC.
 */

export type GameStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type TshirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export const TSHIRT_SIZES: readonly TshirtSize[] = ['S', 'M', 'L', 'XL', 'XXL'];
export type ArticleKind = 'KEYCHAIN' | 'TSHIRT' | 'CAP';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
export type ShippingStatus = 'TO_SHIP' | 'SHIPPED';
export type EntryStatus = 'VALID' | 'CANCELLED';

/* ---------- Public ---------- */

export interface PublicGame {
  gameName: string;
  status: GameStatus;
  startAt: string;
  endAt: string;
  drawAt: string | null;
  acceptingOrders: boolean;
  shippingFeeCents: number;
  associationName: string;
  associationPercent: number;
  associationRaisedCents: number;
  entriesCount: number;
  organizerName: string;
  organizerDetails: string;
  bailiffName: string;
  bailiffDetails: string;
  rulesUrl: string | null;
}

export interface PackComponent {
  kind: ArticleKind;
  label: string;
  quantity: number;
}

export interface PublicPack {
  code: string;
  name: string;
  description: string;
  priceCents: number;
  chances: number;
  imageUrl: string | null;
  components: PackComponent[];
  tshirtCount: number;
  available: boolean;
}

export interface PublicStock {
  tshirtSizes: { size: TshirtSize; available: boolean }[];
  keychainAvailable: boolean;
  capAvailable: boolean;
}

export interface Prize {
  id: string;
  rank: number;
  name: string;
  description: string;
  valueCents: number | null;
  imageUrl: string | null;
}

export interface CheckoutCustomer {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
}

export interface CheckoutRequest {
  customer: CheckoutCustomer;
  items: { packCode: string; tshirtSizes: TshirtSize[] }[];
  acceptRules: boolean;
  certifyAccurate: boolean;
  marketingOptIn: boolean;
}

/** Reponse de `POST /public/orders/checkout` et `GET /public/orders/{ref}/payment`. */
export interface PaymentSession {
  orderReference: string;
  clientSecret: string;
  publishableKey: string;
  totalCents: number;
  itemsCents: number;
  shippingCents: number;
  chances: number;
  expiresAt: string;
}

export interface OrderStatusResponse {
  orderReference: string;
  status: OrderStatus;
  chances: number;
  entriesCount: number;
  email: string;
  ticketNumbers: string[] | null;
}

export interface MyOrderLine {
  packName: string;
  unitPriceCents: number;
  chances: number;
  tshirtSizes: string[];
}

export interface MyEntry {
  ticketNumber: string;
  status: EntryStatus;
  createdAt: string;
}

export interface MyOrder {
  reference: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  totalCents: number;
  shippingStatus: ShippingStatus | null;
  trackingNumber: string | null;
  lines: MyOrderLine[];
  entries: MyEntry[];
}

export interface MyParticipations {
  email: string;
  totalValidEntries: number;
  orders: MyOrder[];
}

/** Format d'erreur commun de hkod-api (`ErrorResponse`). */
export interface ApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  code?: string;
  path?: string;
  timestamp?: string;
  fieldErrors?: { field: string; message: string }[];
  details?: unknown;
}

/* ---------- Admin ---------- */

export interface AdminSession {
  token: string;
  expiresAt: string;
}

export interface AdminStats {
  revenueCents: number;
  itemsCents: number;
  shippingCents: number;
  associationCents: number;
  paidOrders: number;
  pendingOrders: number;
  refundedOrders: number;
  validEntries: number;
  cancelledEntries: number;
  packs: { code: string; name: string; sold: number; revenueCents: number }[];
  daily: { date: string; orders: number; revenueCents: number; entries: number }[];
  toShip: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface AdminOrderSummary {
  id: string;
  reference: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  firstName: string;
  lastName: string;
  email: string;
  totalCents: number;
  chances: number;
  shippingStatus: ShippingStatus | null;
  packsSummary: string;
}

/**
 * Detail d'une commande. Le contrat decrit le contenu sans figer chaque nom
 * de champ : la vue lit ces champs de facon tolerante (tout est optionnel).
 */
export interface AdminOrderDetail {
  id: string;
  reference: string;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  postalCode?: string;
  city?: string;
  country?: string;
  customer?: Partial<CheckoutCustomer> & { country?: string };
  acceptedRulesAt?: string | null;
  certifiedAccurateAt?: string | null;
  marketingOptIn?: boolean;
  itemsCents?: number;
  shippingCents?: number;
  totalCents?: number;
  chances?: number;
  shippingStatus?: ShippingStatus | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  lines?: { id?: string; packCode?: string; packName: string; unitPriceCents: number; chances: number; tshirtSizes: string[] | string | null }[];
  entries?: { id?: string; ticketNumber: string; status: EntryStatus; createdAt: string; cancelReason?: string | null }[];
  audit?: { id?: string; at: string; type: string; payload?: string | null }[];
  auditEvents?: { id?: string; at: string; type: string; payload?: string | null }[];
}

export interface AdminStockItem {
  sku: string;
  kind: ArticleKind;
  size: TshirtSize | null;
  label: string;
  stock: number;
  reserved: number;
}

export interface AdminPack {
  code: string;
  name: string;
  description: string;
  priceCents: number;
  chances: number;
  position?: number;
  active: boolean;
  imageUrl: string | null;
  components?: PackComponent[];
}

export interface AdminSettings {
  gameName: string;
  startAt: string;
  endAt: string;
  drawAt: string | null;
  status: GameStatus;
  shippingFeeCents: number;
  associationPercent: number;
  associationName: string;
  organizerName: string;
  organizerDetails: string;
  bailiffName: string;
  bailiffDetails: string;
  rulesUrl: string | null;
  closedAt?: string | null;
}

export interface AdminPrize {
  id: string;
  rank: number;
  name: string;
  description: string;
  valueCents: number | null;
  imageUrl: string | null;
  active: boolean;
}

export interface AdminEntry {
  id: string;
  ticketNumber: string;
  status: EntryStatus;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  orderReference: string;
  cancelReason: string | null;
}

export interface DrawExport {
  id: string;
  createdAt: string;
  entriesCount: number;
  sha256: string;
}
