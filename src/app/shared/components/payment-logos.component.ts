import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pictogrammes generiques des moyens de paiement acceptes (carte bancaire,
 * Visa, Mastercard, Apple Pay, Google Pay). Dessins simplifies en SVG ;
 * aucune marque de prestataire de paiement.
 */
@Component({
  selector: 'app-payment-logos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-wrap items-center gap-1.5" aria-label="Moyens de paiement acceptés">
      <li>
        <svg width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Carte bancaire">
          <rect width="38" height="24" rx="3" fill="#fff" />
          <rect x="2" y="2" width="34" height="20" rx="2" fill="#1d4f91" />
          <path d="M2 14 L36 6 V22 H2Z" fill="#0f8a5f" opacity="0.9" />
          <text x="19" y="16.5" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="10" font-weight="800" fill="#fff">CB</text>
        </svg>
      </li>
      <li>
        <svg width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Visa">
          <rect width="38" height="24" rx="3" fill="#fff" />
          <text x="19" y="16" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-style="italic" font-weight="800" fill="#1a1f71">VISA</text>
        </svg>
      </li>
      <li>
        <svg width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Mastercard">
          <rect width="38" height="24" rx="3" fill="#fff" />
          <circle cx="15.5" cy="12" r="6.5" fill="#eb001b" />
          <circle cx="22.5" cy="12" r="6.5" fill="#f79e1b" />
          <path d="M19 6.5a6.5 6.5 0 0 1 0 11 6.5 6.5 0 0 1 0-11Z" fill="#ff5f00" />
        </svg>
      </li>
      <li>
        <svg width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Apple Pay">
          <rect width="38" height="24" rx="3" fill="#fff" />
          <path
            d="M11.6 8.9c.4-.5.7-1.2.6-1.9-.6 0-1.3.4-1.7.9-.4.4-.7 1.1-.6 1.8.7.1 1.3-.3 1.7-.8Zm.6 1c-.9-.1-1.7.5-2.2.5-.4 0-1.1-.5-1.9-.5-1 0-1.9.6-2.4 1.5-1 1.8-.3 4.4.7 5.8.5.7 1 1.4 1.8 1.4.7 0 1-.5 1.9-.5s1.1.5 1.9.5 1.3-.7 1.7-1.4c.5-.8.7-1.5.8-1.6 0 0-1.5-.6-1.5-2.3 0-1.4 1.2-2.1 1.2-2.2-.6-1-1.7-1.1-2-1.2Z"
            fill="#000"
          />
          <text x="25" y="16" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="9.5" font-weight="600" fill="#000">Pay</text>
        </svg>
      </li>
      <li>
        <svg width="38" height="24" viewBox="0 0 38 24" role="img" aria-label="Google Pay">
          <rect width="38" height="24" rx="3" fill="#fff" />
          <text x="7" y="16" font-family="Inter, Arial, sans-serif" font-size="10.5" font-weight="700">
            <tspan fill="#4285f4">G</tspan><tspan fill="#5f6368" dx="1.5">Pay</tspan>
          </text>
        </svg>
      </li>
    </ul>
  `,
})
export class PaymentLogosComponent {}
