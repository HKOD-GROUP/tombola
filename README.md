# Tombola — front

Angular 18 SSR (socle HKOD, repris de manyclass). Backend : module `tombolaAPI` de hkod-api (`/api/v1/tombola`).

## Développement

```bash
npm install
npm start                      # http://localhost:4208 (API : environment.ts)
npx ng build                   # production -> https://api.hkodgroup.com
npx ng build --configuration=dev   # dev -> https://dev-api.hkodgroup.com
npm run serve:ssr:tombola      # serveur SSR (port 4000, ou PORT=...)
```

En local, hkod-api tourne avec le profil `local` : `https://localhost:8082` (certificat auto-signé à accepter une fois dans le navigateur).

## Déploiement

- Image `ghcr.io/hermann93360/tombola` (Dockerfile multi-stage, `--build-arg NG_CONFIG=dev|production`).
- Helm `.helm-chart/angular-app` : `values.yaml` (prod, `tombola.fr` + `www.tombola.fr`), `values-dev.yaml` (`dev.tombola.fr`).
- Workflows : `publish-image.yaml` (push `main` → release `tombola`), `publish-image-dev.yaml` (push `dev` → release `tombola-dev`), `publish-image-manually.yaml`. Secrets : `TOKEN`, `KUBECONFIG`.

## Apple Pay

`public/.well-known/apple-developer-merchantid-domain-association` est un fichier **vide** (placeholder).
À remplacer par le fichier téléchargé depuis le Dashboard du prestataire de paiement
(Settings › Payment method domains), puis enregistrer les domaines `tombola.fr`, `www.tombola.fr` et `dev.tombola.fr`.
Le serveur SSR le sert tel quel en `text/plain`.

## Paiement

Paiement intégré (Payment Element + Express Checkout Element, `@stripe/stripe-js` chargé à la demande dans le navigateur uniquement).
Aucune redirection ni mention du prestataire dans l'interface ; la clé publique est fournie par l'API (`publishableKey`).
# tombola
