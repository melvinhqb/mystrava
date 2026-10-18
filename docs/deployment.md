# Déploiement

Deux workflows GitHub Actions :

| Workflow | Déclencheur | Rôle |
| --- | --- | --- |
| `deploy.yml` — Déploiement GitHub Pages | 2×/jour (05:17 et 17:17 UTC), push sur `main`, manuel | Récupère les données Strava, build de l'app et de Storybook, publication sur Pages |
| `ci.yml` — CI | pull request | Lint, build, build Storybook (sans données Strava) |

## Les données ne sont jamais commitées

`deploy.yml` exécute `npm run sync` juste avant le build : `public/data.json` est créé dans l'environnement
éphémère de l'Action, copié par Vite dans `dist/`, puis publié avec le site. Le fichier est listé dans
`.gitignore` et le workflow n'a que la permission `contents: read` : il ne peut pas écrire dans le dépôt.

Si la récupération échoue (jeton expiré, API indisponible…), le job s'arrête avant la publication et la
version précédente du site reste en ligne.

## Configuration de GitHub Pages

Dans *Settings → Pages*, choisissez **Source : GitHub Actions** (et non plus « Deploy from a branch »).

## Contenu publié

```
dist/
├── index.html, assets/   # application
├── data.json             # données Strava du jour (uniquement dans l'artefact publié)
└── storybook/            # Storybook statique (données de démo uniquement)
```

Vite est configuré avec `base: './'` : le site fonctionne quel que soit le sous-chemin
(`https://<utilisateur>.github.io/mystrava/`).

## Points d'attention

- **Désactivation des tâches planifiées** : GitHub suspend les déclencheurs `schedule` d'un dépôt public
  après 60 jours sans activité. Comme les données ne sont plus commitées, aucun commit automatique ne
  maintient le dépôt actif ; GitHub envoie un e-mail avant la suspension, et il suffit de réactiver le
  workflow dans l'onglet *Actions*.
- **Données publiques** : `data.json` reste accessible à quiconque visite le site, comme la page elle-même.
