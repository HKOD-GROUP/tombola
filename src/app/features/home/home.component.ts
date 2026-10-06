import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BadgeCheck,
  FileText,
  Gavel,
  HandHeart,
  Layers,
  LucideAngularModule,
  Package,
  Plus,
  Shirt,
  Ticket,
  Truck,
} from 'lucide-angular';

import { GameService } from '../../core/services/game.service';
import { formatDateLong, formatEuros, isPlaceholder, plural } from '../../core/utils/format';
import { PrizeVisualComponent } from '../../shared/components/prize-visual.component';
import { TodoComponent } from '../../shared/components/todo.component';
import { BuyBoxComponent } from './buy-box.component';

/** Photo produit de la section « Des produits faits avec le cœur ». */
const PRODUCT_PHOTO = 'https://alrapybsfqcnraeqmyhg.supabase.co/storage/v1/object/public/HkodFiles/tombola/produits/tshirt-dos.jpg';

interface FaqItem {
  q: string;
  a: string;
}

/**
 * Accueil = landing du jeu avec le parcours d'achat integre (`#participer`) :
 * hero, etapes, buy-box, cadre legal, lots, bandeau, association,
 * fonctionnement des participations, produits, FAQ.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, BuyBoxComponent, PrizeVisualComponent, TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  readonly game = inject(GameService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly icFile = FileText;
  readonly icCheck = BadgeCheck;
  readonly icGavel = Gavel;
  readonly icHeart = HandHeart;
  readonly icLayers = Layers;
  readonly icPackage = Package;
  readonly icPlus = Plus;
  readonly icShirt = Shirt;
  readonly icTicket = Ticket;
  readonly icTruck = Truck;

  readonly formatEuros = formatEuros;
  readonly plural = plural;
  readonly isPlaceholder = isPlaceholder;
  readonly productPhoto = PRODUCT_PHOTO;

  /** Badge flottant « Participe maintenant » : masque quand la buy-box est a l'ecran. */
  readonly showFloating = signal(false);

  readonly firstPrize = computed(() => this.game.prizes()?.[0] ?? null);
  readonly prizeCount = computed(() => this.game.prizes()?.length ?? 0);

  readonly maxChances = computed(() => {
    const packs = this.game.packs();
    return packs && packs.length ? Math.max(...packs.map((p) => p.chances)) : 10;
  });

  readonly cheapest = computed(() => {
    const packs = this.game.packs();
    return packs && packs.length ? Math.min(...packs.map((p) => p.priceCents)) : 1000;
  });

  /** « 1, 2, 4 ou 10 » */
  readonly chancesList = computed(() => {
    const values = [...new Set((this.game.packs() ?? []).map((p) => p.chances))].sort((a, b) => a - b);
    if (!values.length) {
      return '1, 2, 4 ou 10';
    }
    return values.length === 1 ? String(values[0]) : `${values.slice(0, -1).join(', ')} ou ${values[values.length - 1]}`;
  });

  readonly drawLabel = computed(() => {
    const g = this.game.game();
    return g?.drawAt ? `le ${formatDateLong(g.drawAt)}` : 'après la clôture du jeu, à une date communiquée sur le site';
  });

  readonly bailiff = computed(() => {
    const name = this.game.game()?.bailiffName;
    return name && !isPlaceholder(name) ? name : null;
  });

  readonly marquee = computed(() => [
    `${this.game.associationPercent()} % reversés à ${this.game.associationName()}`,
    'Tirage par commissaire de justice',
    'Paiement sécurisé',
    'Livraison en France métropolitaine',
  ]);

  readonly faq = computed<{ title: string; items: FaqItem[] }[]>(() => {
    const g = this.game.game();
    const packs = this.game.packs() ?? [];
    const asso = this.game.associationName();
    const pct = this.game.associationPercent();
    const fee = g ? formatEuros(g.shippingFeeCents) : 'un forfait unique';
    const packList = packs.length
      ? packs.map((p) => `${p.name} (${formatEuros(p.priceCents, true)}) : ${plural(p.chances, 'participation')}`).join(' · ')
      : 'Le détail est indiqué sur chaque pack.';
    return [
      {
        title: 'Participation',
        items: [
          {
            q: 'Comment je participe ?',
            a: 'Choisis un pack de produits, la taille de ton ou tes t-shirts, puis valide ta commande et règle-la en ligne. Chaque pack donne droit à un nombre défini de participations au tirage. Tes numéros de participation t’arrivent par e-mail dès que le paiement est confirmé.',
          },
          {
            q: 'Dois-je créer un compte ?',
            a: 'Non, aucun compte n’est nécessaire. Pour retrouver tes commandes et tes numéros, demande un lien personnel par e-mail depuis la page « Mes participations » (lien valable 7 jours).',
          },
          { q: 'Combien de participations donne chaque pack ?', a: packList },
          {
            q: 'Les participations sont-elles comptées par commande ou par pack ?',
            a: 'Par pack. Si tu commandes deux fois le même pack, tu obtiens deux fois ses participations. Les frais de livraison ne donnent pas droit à des participations.',
          },
          {
            q: 'Qui peut participer ?',
            a: 'Les personnes majeures (18 ans révolus à la date de la commande) résidant en France métropolitaine, Corse comprise.',
          },
          {
            q: 'Quand et comment a lieu le tirage ?',
            a: `À la fin du jeu, la liste des participations est figée, horodatée et remise au commissaire de justice, qui réalise lui-même le tirage au sort ${this.drawLabel()}. Les gagnants sont prévenus par e-mail et/ou téléphone, selon les modalités du règlement.`,
          },
        ],
      },
      {
        title: 'Produits et lots',
        items: [
          {
            q: 'Quels sont les lots à gagner ?',
            a: 'Les lots sont présentés plus haut sur cette page et listés dans le règlement du jeu, avec leur valeur indicative. Ils ne peuvent être ni échangés, ni convertis en argent.',
          },
          {
            q: 'Comment choisir ma taille de t-shirt ?',
            a: 'Les t-shirts existent du S au XXL. Tu choisis une taille par t-shirt : un pack qui en contient deux te permet de choisir deux tailles différentes. Une taille épuisée apparaît barrée.',
          },
          {
            q: 'Où et comment sont livrés les produits ?',
            a: `En France métropolitaine uniquement (Corse comprise), à l’adresse indiquée lors de la commande, pour un forfait de ${fee} par commande. Tu reçois un e-mail lors de l’expédition, avec le numéro de suivi quand il existe.`,
          },
          {
            q: `Quelle part est reversée à ${asso} ?`,
            a: `${pct} % du montant des packs vendus (hors frais de livraison), net des remboursements. Le montant collecté est affiché en continu sur cette page.`,
          },
        ],
      },
      {
        title: 'Paiement et sécurité',
        items: [
          {
            q: 'Le paiement est-il sécurisé ?',
            a: 'Oui. Tu paies par carte bancaire, Apple Pay ou Google Pay sur une connexion chiffrée. Tes coordonnées bancaires ne transitent pas par nos serveurs et ne sont jamais conservées. Ta banque peut te demander une confirmation (3-D Secure).',
          },
          {
            q: 'Comment savoir que ma participation est bien prise en compte ?',
            a: 'Dès la confirmation du paiement, tu reçois un e-mail récapitulatif avec tes numéros de participation (par exemple TMB-000123). Ils restent consultables à tout moment dans « Mes participations ».',
          },
          {
            q: 'Combien de temps mes articles sont-ils réservés ?',
            a: 'Tes articles sont réservés pendant 30 minutes, le temps de régler la commande. Passé ce délai, ils sont remis en vente et il suffit de repasser commande.',
          },
          {
            q: 'Que se passe-t-il en cas de remboursement ?',
            a: 'Le remboursement d’une commande (par exemple en cas de rétractation) entraîne l’annulation des participations qui y sont attachées.',
          },
        ],
      },
    ];
  });

  constructor() {
    this.game.loadGame().subscribe();
    this.game.loadPacks().subscribe();
    this.game.loadPrizes().subscribe();

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const box = this.host.nativeElement.querySelector('#participer');
      const hero = this.host.nativeElement.querySelector('#hero');
      if (!box || typeof IntersectionObserver === 'undefined') {
        return;
      }
      const visible = new Map<Element, boolean>();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visible.set(e.target, e.isIntersecting);
          }
          this.showFloating.set(!visible.get(box) && !visible.get(hero ?? box));
        },
        { threshold: 0 },
      );
      observer.observe(box);
      if (hero) {
        observer.observe(hero);
      }
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
