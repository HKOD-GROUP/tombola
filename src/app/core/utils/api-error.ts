import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/tombola.models';

/** Messages francais des codes d'erreur metier du contrat. */
const CODE_MESSAGES: Record<string, string> = {
  UNDERAGE: 'La participation est réservée aux personnes majeures (18 ans révolus).',
  RULES_NOT_ACCEPTED: 'Merci d’accepter le règlement et de certifier l’exactitude de vos informations.',
  INVALID_SIZES: 'Merci de choisir une taille pour chaque t-shirt de vos packs.',
  UNSUPPORTED_POSTAL_CODE: 'La livraison est possible uniquement en France métropolitaine (Corse comprise).',
  PACK_NOT_FOUND: 'Un des packs de votre panier n’est plus proposé. Merci de mettre à jour votre panier.',
  OUT_OF_STOCK: 'Un article de votre panier vient d’être épuisé. Merci de modifier votre panier (taille ou pack).',
  GAME_NOT_OPEN: 'Le jeu n’est pas ouvert en ce moment : les commandes sont suspendues.',
  ORDER_NOT_PAYABLE: 'Cette commande ne peut plus être payée (délai de réservation dépassé ou paiement déjà effectué).',
  INVALID_TOKEN: 'Ce lien n’est plus valide. Demandez-en un nouveau ci-dessous.',
  INVALID_PASSWORD: 'Mot de passe incorrect.',
  ADMIN_CONSOLE_DISABLED: 'La console d’administration n’est pas activée sur ce serveur.',
  GAME_NOT_ENDED: 'Le jeu n’est pas encore terminé : la clôture n’est possible qu’après la date de fin.',
  PENDING_PAYMENTS: 'Des paiements sont encore en cours (moins de 35 minutes). Réessayez un peu plus tard.',
  ORDER_NOT_FOUND: 'Commande introuvable.',
  INVALID_ITEMS: 'Votre panier est vide ou contient trop de packs (50 maximum par commande).',
  GAME_CLOSED: 'Le jeu est clôturé : cette action n’est plus possible.',
  PAYMENT_NOT_CONFIGURED: 'Le paiement est momentanément indisponible. Merci de réessayer un peu plus tard.',
  PAYMENT_UNAVAILABLE: 'Le paiement est momentanément indisponible. Merci de réessayer dans quelques instants.',
  ORDER_NOT_SHIPPABLE: 'Seule une commande payée et non expédiée peut être marquée comme expédiée.',
  ORDER_NOT_REFUNDABLE: 'Seule une commande payée peut être remboursée.',
  REFUND_FAILED: 'Le remboursement a échoué auprès du prestataire de paiement. Réessayez ou passez par le tableau de bord du prestataire.',
  GAME_ALREADY_CLOSED: 'Le jeu est déjà clôturé.',
  GAME_NOT_CLOSED: 'Clôturez d’abord le jeu pour générer un export.',
  STATUS_NOT_ALLOWED: 'La clôture se fait uniquement depuis l’onglet Participations & tirage.',
  ENTRY_ALREADY_CANCELLED: 'Cette participation est déjà annulée.',
  INVALID_DATES: 'La date de fin doit être postérieure à la date de début.',
  UNSUPPORTED_FILE_TYPE: 'Format d’image non pris en charge (JPEG, PNG ou WebP).',
  FILE_TOO_LARGE: 'Image trop lourde (5 Mo maximum).',
  EMPTY_FILE: 'Le fichier est vide.',
};

export interface ParsedApiError {
  status: number;
  code: string | null;
  message: string;
  fieldErrors: { field: string; message: string }[];
  body: ApiErrorBody | null;
}

export function parseApiError(err: unknown, fallback = 'Une erreur est survenue. Merci de réessayer.'): ParsedApiError {
  if (err instanceof HttpErrorResponse) {
    const body = (err.error && typeof err.error === 'object' ? err.error : null) as ApiErrorBody | null;
    const code = body?.code ?? null;
    let message: string;
    if (err.status === 0) {
      message = 'Le service est momentanément injoignable. Vérifiez votre connexion puis réessayez.';
    } else if (code && CODE_MESSAGES[code]) {
      message = CODE_MESSAGES[code];
    } else if (body?.message && err.status < 500) {
      message = body.message;
    } else {
      message = fallback;
    }
    return { status: err.status, code, message, fieldErrors: body?.fieldErrors ?? [], body };
  }
  return { status: -1, code: null, message: fallback, fieldErrors: [], body: null };
}
