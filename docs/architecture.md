# Architecture

## Vue d'ensemble

```
GitHub Action deploy.yml (2×/jour + push sur main)
  ├─ npm run sync ──API Strava──▶ public/data.json   (fichier temporaire, ignoré par git)
  ├─ build Vite + Storybook ────▶ dist/
  └─ publication ───────────────▶ GitHub Pages ──▶ navigateur (cache HTTP)
```

Le site est **entièrement statique** : la page lit `data.json` au chargement. Ce fichier n'existe que dans
l'artefact publié sur GitHub Pages : **les données ne sont jamais commitées dans le dépôt**. Les secrets Strava
ne servent qu'à la GitHub Action.

Côté navigateur, `data.json` est gardé dans le cache HTTP et revalidé à chaque visite (`cache: 'no-cache'`,
requête conditionnelle par ETag) ; une fois chargées, les données restent en mémoire (état React).

## Organisation du code

Le code suit une organisation **par fonctionnalité** (*feature-based*), courante dans les projets React
(voir par exemple [bulletproof-react](https://github.com/alan2207/bulletproof-react)) :

| Dossier | Contenu | Peut importer |
| --- | --- | --- |
| `src/types/` | Types du format `data.json` (`RawRun`, `Run`, `StravaData`…) | — |
| `src/lib/` | Fonctions pures : dates, formatage fr-FR | `types` |
| `src/api/` | Chargement et normalisation de `data.json`, générateur de démo | `lib`, `types` |
| `src/hooks/` | Hooks partagés (`useElementSize`, `usePersistentState`, `useStravaData`) | `api`, `lib`, `types` |
| `src/components/ui/` | Briques visuelles génériques, sans logique métier | `hooks`, `lib` |
| `src/components/layout/` | Structure de page | `ui`, `lib`, `types` |
| `src/features/dashboard/` | Tuiles du tableau de bord (`components/`) et calculs (`lib/stats.ts`) | tout ce qui précède |
| `src/app/` | Composant racine : état de chargement, période, assemblage | tout |

Règles :

- Une feature expose son API publique dans son `index.ts` ; le reste de l'application n'importe que depuis ce fichier.
- Les calculs statistiques sont des **fonctions pures** (`features/dashboard/lib/stats.ts`), séparées du rendu.
- Chaque composant a ses stories à côté de lui (`Composant.stories.tsx`).
- L'alias `@/` pointe vers `src/` (configuré dans `vite.config.ts` et `tsconfig.app.json`).

## Flux de données

1. `useStravaData` charge `data.json` ; en dev, s'il est absent, il se rabat sur `makeDemoData()`.
2. `toDashboardData` ajoute `startDate` (date locale) à chaque sortie et les trie de la plus récente à la plus ancienne.
3. `App` gère la période choisie (mémorisée dans `localStorage`) et passe les données à `Dashboard`.
4. `Dashboard` découpe les sorties selon la période (`splitByPeriod`) :
   - les tuiles liées à la période reçoivent les sorties de la période (et de la précédente pour les comparaisons) ;
   - les tendances (semaines, mois, calendrier, dernières sorties) reçoivent toutes les sorties.

## Format de `data.json`

Défini par `StravaData` dans `src/types/strava.ts` et produit par `scripts/fetch-strava.ts` :

```jsonc
{
  "athlete": { "id": 1, "firstname": "…", "lastname": "…", "profile": "https://…", "city": "…" },
  "stats": { "all": Totals, "ytd": Totals, "recent": Totals },
  "runs": [
    {
      "id": 123, "name": "Afternoon Run", "type": "Run",
      "date": "2026-10-17T16:14:21Z",   // heure locale suffixée de Z (start_date_local)
      "distance": 22790.9,              // m
      "moving_time": 7512,              // s
      "elevation": 255.6,               // m D+
      "average_speed": 3.034,           // m/s
      "average_heartrate": 159.5,       // ou null
      "kudos": 6
    }
  ],
  "fetchedAt": 1792364030944
}
```

Seuls ces champs sont publiés : ni tracé GPS ni position.

## Graphiques

Les graphiques sont dessinés en **SVG à la main**, sans bibliothèque. `useElementSize` mesure le conteneur
(via `ResizeObserver`) et le SVG est recalculé à chaque redimensionnement. Les couleurs viennent des
variables CSS de `src/styles/global.css`, ce qui gère automatiquement le thème sombre.
