import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import compression from 'compression';
import express, { Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { environment } from './src/environments/environment';
import { REQUEST_COOKIES } from './src/app/core/tokens/platform.tokens';

/**
 * Parcours prives ou transactionnels : le rendu serveur n'y apporte rien
 * (back-office, panier en localStorage, paiement, lien magique). On renvoie
 * directement la coquille CSR, jamais mise en cache.
 */
const CSR_ONLY_PATTERNS: readonly RegExp[] = [
  /^\/admin(\/|$)/,
  /^\/commande(\/|$)/,
  /^\/paiement(\/|$)/,
  /^\/mes-participations(\/|$)/,
];

/** Pages publiques dont le HTML anonyme est mis en cache memoire (60 s). */
const CACHEABLE_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/(le-jeu|reglement|mentions-legales|cgv|confidentialite)$/,
];

/** Routes connues de l'application : tout le reste est servi en 404. */
const KNOWN_ROUTE_PATTERNS: readonly RegExp[] = [...CACHEABLE_PATTERNS, ...CSR_ONLY_PATTERNS];

const CACHE_MAX_ENTRIES = 50;
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  html: string;
  createdAt: number;
}

/** Cache LRU minimal : Map ordonnee par insertion, re-insertion a chaque hit. */
class HtmlCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
      this.entries.delete(key);
      return null;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.html;
  }

  set(key: string, html: string): void {
    this.entries.delete(key);
    this.entries.set(key, { html, createdAt: Date.now() });
    while (this.entries.size > CACHE_MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.entries.delete(oldest);
    }
  }
}

/* ---------- Sitemap statique ---------- */

const SITE_URL = environment.siteUrl.replace(/\/+$/, '');

const SITEMAP_PAGES: readonly { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/le-jeu', changefreq: 'monthly', priority: '0.7' },
  { path: '/reglement', changefreq: 'monthly', priority: '0.5' },
  { path: '/cgv', changefreq: 'yearly', priority: '0.2' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.1' },
  { path: '/confidentialite', changefreq: 'yearly', priority: '0.1' },
];

/** Derniere modification editoriale des pages (a mettre a jour a la main). */
const SITEMAP_LASTMOD = '2026-10-03';

const SITEMAP_XML =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  SITEMAP_PAGES.map(
    (p) =>
      `  <url>\n` +
      `    <loc>${p.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.path}`}</loc>\n` +
      `    <lastmod>${SITEMAP_LASTMOD}</lastmod>\n` +
      `    <changefreq>${p.changefreq}</changefreq>\n` +
      `    <priority>${p.priority}</priority>\n` +
      `  </url>`,
  ).join('\n') +
  `\n</urlset>\n`;

function matchesAny(path: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(path));
}

/** Chemin sans query string ni fragment, sans slash final (sauf racine). */
function cleanPath(url: string): string {
  const path = url.split(/[?#]/)[0] || '/';
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');
  // Coquille CSR produite par le build (`index.csr.html`), sinon `index.html`.
  const csrShellPath = ['index.csr.html', 'index.html']
    .map((name) => join(browserDistFolder, name))
    .find((p) => existsSync(p));

  const commonEngine = new CommonEngine();
  const htmlCache = new HtmlCache();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);
  server.disable('x-powered-by');

  // Gzip/Brotli (selon Accept-Encoding) pour HTML, JS, CSS, JSON, SVG...
  server.use(compression());

  server.get('/sitemap.xml', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(SITEMAP_XML);
  });

  // Fichier de verification Apple Pay : servi tel quel (sans extension).
  server.get('/.well-known/apple-developer-merchantid-domain-association', (_req: Request, res: Response, next) => {
    const file = join(browserDistFolder, '.well-known', 'apple-developer-merchantid-domain-association');
    if (!existsSync(file)) {
      next();
      return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(file, { dotfiles: 'allow' });
  });

  // Ancienne boutique : le parcours d'achat est desormais integre a l'accueil.
  server.get(['/participer', '/participer/'], (_req: Request, res: Response) => {
    res.redirect(301, '/#participer');
  });

  // Bundles hashes (`*.js`, `*.css` a la racine) immuables : un an. Le reste
  // (favicon, manifest, robots, images) : pas de cache long.
  server.get(
    ['/*.js', '/*.css'],
    express.static(browserDistFolder, { maxAge: '1y', immutable: true, index: false, fallthrough: true }),
  );
  server.get('**', express.static(browserDistFolder, { maxAge: '1h', index: false, fallthrough: true }));

  // All regular routes use the Angular engine
  server.get('**', (req: Request, res: Response, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const path = cleanPath(originalUrl);

    if (csrShellPath && matchesAny(path, CSR_ONLY_PATTERNS)) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Ssr-Cache', 'BYPASS');
      res.sendFile(csrShellPath);
      return;
    }

    const known = matchesAny(path, KNOWN_ROUTE_PATTERNS);
    const cacheable = matchesAny(path, CACHEABLE_PATTERNS);
    if (cacheable) {
      const cached = htmlCache.get(path);
      if (cached) {
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
        res.setHeader('X-Ssr-Cache', 'HIT');
        res.send(cached);
        return;
      }
    }

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: REQUEST_COOKIES, useValue: headers.cookie ?? null },
        ],
      })
      .then((html) => {
        if (cacheable) {
          htmlCache.set(path, html);
          res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
          res.setHeader('X-Ssr-Cache', 'MISS');
        } else {
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('X-Ssr-Cache', 'BYPASS');
        }
        // Route inconnue : la page 404 de l'application, avec le bon statut.
        res.status(known ? 200 : 404).send(html);
      })
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
