import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Lock,
  LucideAngularModule,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
} from 'lucide-angular';

import { PublicPack, TSHIRT_SIZES, TshirtSize } from '../../core/models/tombola.models';
import { CartService, MAX_PACKS_PER_ORDER } from '../../core/services/cart.service';
import { GameService } from '../../core/services/game.service';
import { formatDateTimeLong, formatEuros, plural } from '../../core/utils/format';
import { CartSummaryComponent, cartTotals } from '../../shared/components/cart-summary.component';
import { PackVisualComponent } from '../../shared/components/pack-visual.component';

type Step = 1 | 2 | 3;
export type ShopState = 'open' | 'before' | 'ended' | 'closed' | 'unknown';

/** Etat de la boutique : commandes ouvertes, pas encore ouvertes, terminees, suspendues. */
export function shopStateOf(game: GameService): ShopState {
  const g = game.game();
  if (!g) {
    return 'unknown';
  }
  if (g.acceptingOrders) {
    return 'open';
  }
  const now = Date.now();
  if (g.status !== 'CLOSED' && now < new Date(g.startAt).getTime()) {
    return 'before';
  }
  if (g.status === 'CLOSED' || now >= new Date(g.endAt).getTime()) {
    return 'ended';
  }
  return 'closed';
}

/**
 * Parcours d'achat en 3 etapes integre a l'accueil (ancre `#participer`) :
 * 1. choix du pack, 2. tailles des t-shirts (sautee si le pack n'en contient
 * pas), 3. recapitulatif, quantite, ajout au panier multi-packs et validation.
 * Le panier reste celui du `CartService` (localStorage, SSR-safe).
 */
@Component({
  selector: 'app-buy-box',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, PackVisualComponent, CartSummaryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './buy-box.component.html',
})
export class BuyBoxComponent {
  readonly game = inject(GameService);
  readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly sizes = TSHIRT_SIZES;
  readonly formatEuros = formatEuros;
  readonly plural = plural;
  readonly icBack = ArrowLeft;
  readonly icCheck = Check;
  readonly icChevron = ChevronDown;
  readonly icLock = Lock;
  readonly icMinus = Minus;
  readonly icPlus = Plus;
  readonly icBag = ShoppingBag;
  readonly icTruck = Truck;

  readonly step = signal<Step>(1);
  readonly selectedCode = signal<string | null>(null);
  readonly chosenSizes = signal<(TshirtSize | null)[]>([]);
  readonly quantity = signal(1);
  readonly sizeError = signal(false);
  /** Visuel affiche dans la galerie (desktop). */
  readonly galleryIndex = signal(0);
  readonly announcement = signal('');
  /** Message de confirmation apres un ajout au panier. */
  readonly justAdded = signal<string | null>(null);

  readonly selectedPack = computed(() => {
    const code = this.selectedCode();
    return code ? (this.game.packByCode(code) ?? null) : null;
  });

  readonly shopState = computed(() => shopStateOf(this.game));
  readonly startLabel = computed(() => formatDateTimeLong(this.game.game()?.startAt));
  readonly totals = computed(() => cartTotals(this.cart, this.game));

  readonly unavailableSizes = computed(() => {
    const stock = this.game.stock();
    return new Set(stock ? stock.tshirtSizes.filter((s) => !s.available).map((s) => s.size) : []);
  });

  /** Lignes du panier devenues indisponibles (taille epuisee, pack desactive). */
  readonly cartWarnings = computed(() => {
    const out = this.unavailableSizes();
    return this.cart
      .lines()
      .filter((l) => l.tshirtSizes.some((s) => out.has(s)) || this.game.packByCode(l.packCode)?.available === false);
  });

  /** Galerie desktop : visuels des packs puis des lots. */
  readonly gallery = computed(() => {
    const items: { url: string | null; alt: string; pack: PublicPack | null }[] = [];
    for (const p of this.game.packs() ?? []) {
      items.push({ url: p.imageUrl, alt: `${p.name} : visuel du pack`, pack: p });
    }
    for (const prize of this.game.prizes() ?? []) {
      if (prize.imageUrl) {
        items.push({ url: prize.imageUrl, alt: `Lot n°${prize.rank} : ${prize.name}`, pack: null });
      }
    }
    return items;
  });

  readonly galleryItem = computed(() => {
    const items = this.gallery();
    return items.length ? items[Math.min(this.galleryIndex(), items.length - 1)] : null;
  });

  readonly lineTotal = computed(() => (this.selectedPack()?.priceCents ?? 0) * this.quantity());

  constructor() {
    afterNextRender(() => {
      this.game.loadStock().subscribe();
      this.game.loadPacks().subscribe((packs) => packs && this.cart.prune(packs));
      const sub = this.route.fragment.subscribe((f) => {
        if (f === 'panier') {
          this.openCart(false);
        }
      });
      this.destroyRef.onDestroy(() => sub.unsubscribe());
    });
  }


  /** Prix d'une participation (« Une participation revient à … »). */
  unitPrice(pack: PublicPack): string {
    return formatEuros(Math.round(pack.priceCents / Math.max(1, pack.chances)), true);
  }

  /** Pastilles de l'etiquette (une par participation, 4 au plus). */
  dots(pack: PublicPack): number[] {
    return Array.from({ length: Math.min(4, pack.chances) }, (_, i) => i);
  }

  componentsLabel(pack: PublicPack): string {
    return pack.components.map((c) => `${c.quantity} ${c.label.toLowerCase()}${c.quantity > 1 ? 's' : ''}`).join(' + ');
  }

  canBuy(pack: PublicPack): boolean {
    const s = this.shopState();
    return pack.available && s !== 'ended' && s !== 'before';
  }

  choosePack(pack: PublicPack): void {
    if (!this.canBuy(pack)) {
      return;
    }
    this.selectedCode.set(pack.code);
    this.chosenSizes.set(Array.from({ length: pack.tshirtCount }, () => null));
    this.quantity.set(1);
    this.sizeError.set(false);
    this.justAdded.set(null);
    const index = this.gallery().findIndex((g) => g.pack?.code === pack.code);
    if (index >= 0) {
      this.galleryIndex.set(index);
    }
    this.goTo(pack.tshirtCount > 0 ? 2 : 3);
  }

  chooseSize(index: number, size: TshirtSize): void {
    const next = [...this.chosenSizes()];
    next[index] = size;
    this.chosenSizes.set(next);
    this.sizeError.set(false);
  }

  isSizeOut(size: TshirtSize): boolean {
    return this.unavailableSizes().has(size);
  }

  confirmSizes(): void {
    if (this.chosenSizes().some((s) => s === null)) {
      this.sizeError.set(true);
      this.announcement.set('Choisis une taille pour chaque t-shirt.');
      return;
    }
    this.goTo(3);
  }

  changeQuantity(delta: number): void {
    const room = MAX_PACKS_PER_ORDER - this.cart.count();
    this.quantity.set(Math.max(1, Math.min(Math.max(1, room), this.quantity() + delta)));
  }

  /** Ajoute la selection courante au panier ; renvoie `false` si rien n'a ete ajoute. */
  addToCart(): boolean {
    const pack = this.selectedPack();
    if (!pack) {
      return false;
    }
    const sizes = this.chosenSizes();
    if (sizes.some((s) => s === null)) {
      this.goTo(2);
      this.sizeError.set(true);
      return false;
    }
    const added = this.cart.add(pack.code, sizes as TshirtSize[], this.quantity());
    if (added === 0) {
      this.announcement.set(`Ton panier contient déjà ${MAX_PACKS_PER_ORDER} packs, le maximum par commande.`);
      return false;
    }
    const msg = `${added} × ${pack.name} ajouté${added > 1 ? 's' : ''} au panier.`;
    this.justAdded.set(msg);
    this.announcement.set(msg);
    this.selectedCode.set(null);
    this.chosenSizes.set([]);
    this.quantity.set(1);
    return true;
  }

  /** « Ajouter au panier » : ajoute puis revient au choix des packs. */
  addAndContinue(): void {
    if (this.addToCart()) {
      this.goTo(1);
    }
  }

  validateOrder(): void {
    if (this.selectedPack()) {
      if (!this.addToCart() && this.cart.isEmpty()) {
        return;
      }
    }
    if (!this.cart.isEmpty()) {
      void this.router.navigate(['/commande']);
    }
  }

  addAnother(): void {
    this.selectedCode.set(null);
    this.goTo(1);
  }

  back(): void {
    const pack = this.selectedPack();
    if (this.step() === 3 && pack && pack.tshirtCount > 0) {
      this.goTo(2);
    } else {
      this.goTo(1);
    }
  }

  /** Affiche le panier (etape 3 sans selection en cours). */
  openCart(scroll = true): void {
    this.selectedCode.set(null);
    this.step.set(3);
    if (scroll) {
      this.scrollToTop();
    }
  }

  private goTo(step: Step): void {
    this.step.set(step);
    this.scrollToTop();
  }

  /** Ramene le haut de la buy-box a l'ecran et y place le focus (lecteurs d'ecran). */
  private scrollToTop(): void {
    setTimeout(() => {
      const top = this.host.nativeElement.querySelector('#buybox-top') as HTMLElement | null;
      const title = this.host.nativeElement.querySelector('#buybox-title') as HTMLElement | null;
      if (!top || !title) {
        return;
      }
      const y = top.getBoundingClientRect().top;
      if (y < 72 || y > window.innerHeight * 0.6) {
        top.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      }
      title.focus({ preventScroll: true });
    });
  }
}
