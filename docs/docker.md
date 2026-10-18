# Image Docker

L'application est publiée sous forme d'image Docker sur GitHub Container Registry à chaque release,
pour l'héberger ailleurs que sur GitHub Pages (VPS, NAS, Raspberry Pi…).

```
ghcr.io/melvinhqb/mystrava:<version>   # ex. 1.2.0, 1.2, 1, latest
```

Plateformes : `linux/amd64` et `linux/arm64`.

## Lancer le conteneur

```sh
docker run -d --name mystrava -p 8080:8080 \
  -e STRAVA_CLIENT_ID=… \
  -e STRAVA_CLIENT_SECRET=… \
  -e STRAVA_REFRESH_TOKEN=… \
  --restart unless-stopped \
  ghcr.io/melvinhqb/mystrava:latest
```

Le site est alors disponible sur <http://localhost:8080>. Les secrets s'obtiennent comme indiqué dans
[strava-setup.md](strava-setup.md). On peut aussi réutiliser le fichier `.env` local :
`docker run --env-file .env …`.

Avec Docker Compose :

```yaml
services:
  mystrava:
    image: ghcr.io/melvinhqb/mystrava:latest
    ports: ["8080:8080"]
    env_file: .env
    restart: unless-stopped
```

## Fonctionnement

L'image ne contient **ni données ni secrets** : seulement le build statique (`dist/`), le binaire Node et
deux scripts.

- `scripts/server.ts` (processus principal) sert le site et expose `/healthz` pour le `HEALTHCHECK`.
- Au démarrage puis toutes les `SYNC_INTERVAL_HOURS` heures, il appelle `syncStrava()` de
  `scripts/fetch-strava.ts`, qui écrit `dist/data.json` dans le conteneur (écriture atomique).
- En cas d'échec (secrets invalides, API indisponible), l'erreur est journalisée et la dernière version de
  `data.json` reste servie. Sans secrets, la page affiche l'écran d'accueil.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN` | — | Accès à l'API Strava |
| `SYNC_INTERVAL_HOURS` | `12` | Fréquence de rafraîchissement des données |
| `PORT` | `8080` | Port d'écoute |

Le conteneur tourne avec l'utilisateur non privilégié `node`. Les fichiers de `assets/` (noms avec hash)
sont mis en cache un an, `index.html` et `data.json` sont revalidés à chaque visite.

> Storybook n'est pas inclus dans l'image : il reste publié sur GitHub Pages.

## Publier une release

```sh
npm version minor            # ou patch / major : met à jour package.json et crée le tag X.Y.Z (sans « v », voir .npmrc)
git push --follow-tags
```

Le workflow `.github/workflows/release.yml` construit alors l'image (amd64 + arm64), la pousse sur GHCR
avec les tags `X.Y.Z`, `X.Y`, `X` et `latest`, puis crée la release GitHub avec des notes générées à
partir des commits.

Au premier envoi, le paquet peut être créé en **privé** : rendez-le public dans
*GitHub → Packages → mystrava → Package settings → Change visibility* si l'image doit pouvoir être
téléchargée sans authentification.

## Construire l'image en local

```sh
docker build -t mystrava .
docker run --rm -p 8080:8080 --env-file .env mystrava
```

`.dockerignore` exclut `.env` et `public/data.json` : ni secret ni donnée ne peut se retrouver dans l'image.

## Taille

Environ 200 Mo décompressés (≈ 50 Mo compressés), dont 126 Mo pour le binaire Node. L'étape d'exécution
part d'un Alpine nu pour ne pas embarquer npm ni yarn ; sa version doit rester alignée sur celle de
`node:24-alpine` (libc musl).
