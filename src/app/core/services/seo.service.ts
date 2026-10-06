import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';

/** Metadonnees d'une page : titre, description, image de partage, indexation. */
export interface SeoConfig {
  /** Titre complet de l'onglet et du partage (sans suffixe ajoute). */
  readonly title: string;
  readonly description: string;
  /** Chemin ou URL de l'image de partage ; par defaut l'image de l'accueil (1200 x 630). */
  readonly image?: string | null;
  /** Texte alternatif de l'image de partage. */
  readonly imageAlt?: string;
  readonly type?: 'website' | 'article';
  /** Pages privees ou transitoires : `noindex, nofollow`. */
  readonly noindex?: boolean;
  /** Chemin canonique, par defaut l'URL courante sans query ni fragment. */
  readonly canonicalPath?: string;
}

export const SITE_NAME = 'Tombola';
export const DEFAULT_OG_IMAGE = '/og-image.png';
const DEFAULT_OG_IMAGE_ALT = 'Tombola solidaire — 10 % reversés à l’association Les enfants oubliés';

/**
 * Pose les balises <title>, description, canonical, Open Graph, Twitter et
 * robots d'une page. Fonctionne en SSR : les balises sont rendues dans le HTML
 * servi aux robots et aux apercus de lien (WhatsApp, LinkedIn, Slack…).
 *
 * Deux sources : les `data.seo` des routes (pages statiques, appliquees par
 * `AppComponent` a chaque navigation) et un appel direct depuis les pages dont
 * le contenu vient de l'API (programme, chapitre en apercu).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly siteUrl = environment.siteUrl.replace(/\/+$/, '');

  apply(config: SeoConfig): void {
    const path = config.canonicalPath ?? this.currentPath();
    const url = this.absolute(path);
    const image = this.absolute(config.image || DEFAULT_OG_IMAGE);
    const isDefaultImage = !config.image || config.image === DEFAULT_OG_IMAGE;
    const imageAlt = config.imageAlt ?? (isDefaultImage ? DEFAULT_OG_IMAGE_ALT : config.title);

    this.titleService.setTitle(config.title);
    this.setName('description', config.description);
    this.setName('robots', config.noindex ? 'noindex, nofollow' : 'index, follow');
    this.setCanonical(url);

    this.setProperty('og:site_name', SITE_NAME);
    this.setProperty('og:locale', 'fr_FR');
    this.setProperty('og:type', config.type ?? 'website');
    this.setProperty('og:title', config.title);
    this.setProperty('og:description', config.description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', image);
    this.setProperty('og:image:alt', imageAlt);
    if (isDefaultImage) {
      this.setProperty('og:image:width', '1200');
      this.setProperty('og:image:height', '630');
    } else {
      // Dimensions inconnues pour une image venue de l'API : on retire les balises.
      this.meta.removeTag("property='og:image:width'");
      this.meta.removeTag("property='og:image:height'");
    }

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', config.title);
    this.setName('twitter:description', config.description);
    this.setName('twitter:image', image);
    this.setName('twitter:image:alt', imageAlt);
  }

  /** Insere (ou remplace) un bloc JSON-LD identifie par `id` dans <head>. */
  setJsonLd(id: string, data: object): void {
    const scriptId = `ld-${id}`;
    let script = this.document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  removeJsonLd(id: string): void {
    this.document.getElementById(`ld-${id}`)?.remove();
  }

  /** URL absolue sur le site pour un chemin interne ; une URL deja absolue est rendue telle quelle. */
  absolute(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return pathOrUrl;
    }
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return path === '/' ? `${this.siteUrl}/` : `${this.siteUrl}${path}`;
  }

  private currentPath(): string {
    const path = this.router.url.split(/[?#]/)[0];
    return path || '/';
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name='${name}'`);
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property='${property}'`);
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }
}
