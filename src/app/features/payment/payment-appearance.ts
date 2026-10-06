import type { Appearance, StripeElementsOptionsMode } from '@stripe/stripe-js';

/**
 * Habillage des champs de paiement aux couleurs du site (Appearance API) :
 * memes polices, couleurs, rayons et etats de focus que nos formulaires.
 */
export const PAYMENT_APPEARANCE: Appearance = {
  theme: 'flat',
  labels: 'above',
  variables: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontSizeBase: '15px',
    fontWeightNormal: '400',
    fontWeightMedium: '500',
    fontWeightBold: '600',
    colorPrimary: '#141416',
    colorBackground: '#FFFFFF',
    colorText: '#141416',
    colorTextSecondary: '#696970',
    colorTextPlaceholder: '#A1A1AA',
    colorDanger: '#B42318',
    colorIcon: '#52525B',
    borderRadius: '6px',
    spacingUnit: '4px',
    gridRowSpacing: '14px',
    focusBoxShadow: '0 0 0 3px rgba(20, 20, 22, 0.12)',
    focusOutline: 'none',
  },
  rules: {
    '.Input': {
      border: '1px solid #E4E4E7',
      boxShadow: 'none',
      padding: '11px 14px',
    },
    '.Input:focus': {
      border: '1px solid #141416',
      boxShadow: '0 0 0 3px rgba(20, 20, 22, 0.12)',
    },
    '.Input--invalid': {
      border: '1px solid #B42318',
      boxShadow: 'none',
    },
    '.Label': {
      fontSize: '13.5px',
      fontWeight: '600',
      color: '#3F3F46',
      marginBottom: '6px',
    },
    '.Tab': {
      border: '1px solid #E4E4E7',
      backgroundColor: '#FFFFFF',
      boxShadow: 'none',
    },
    '.Tab:hover': {
      backgroundColor: '#FAFAFA',
    },
    '.Tab--selected, .Tab--selected:hover, .Tab--selected:focus': {
      border: '1px solid #141416',
      backgroundColor: '#F4F4F5',
      color: '#141416',
      boxShadow: 'none',
    },
    '.Error': {
      fontSize: '13.5px',
    },
  },
};

export const PAYMENT_FONTS: StripeElementsOptionsMode['fonts'] = [
  { cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' },
];
