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
| `src/features/dashboard/` | Tuiles du tableau de bord (`components/`), catalogue des blocs et formats (`blocks.tsx`), disposition (`layout.ts`) et calculs (`lib/stats.ts`) | tout ce qui précède |
| `src/app/` | Composant racine : état de chargement, période, assemblage | tout |

Règles :

- Une feature expose son API publique dans son `index.ts` ; le reste de l'application n'importe que depuis ce fichier.
- Les calculs statistiques sont des **fonctions pures** (`features/dashboard/lib/stats.ts`), séparées du rendu.
- Chaque composant a ses stories à côté de lui (`Composant.stories.tsx`).
- L'alias `@/` pointe vers `src/` (configuré dans `vite.config.ts` et `tsconfig.app.json`).

## Flux de données

1. `useStravaData` charge `data.json` ; en dev, s'il est absent, il se rabat sur `makeDemoData()`.
2. `toDashboardData` ajoute `startDate` (date locale) à chaque sortie et les trie de la plus récente à la plus ancienne.
3. `App` gère la période choisie et la disposition personnalisée (`useDashboardLayout`), toutes deux mémorisées dans `localStorage`, et passe les données à `Dashboard`.
4. `Dashboard` découpe les sorties selon la période (`splitByPeriod`) puis rend les blocs de `layout.ts` dans l'ordre :
   - les tuiles liées à la période reçoivent les sorties de la période (et de la précédente pour les comparaisons) ;
   - les tendances (semaines, mois, calendrier, dernières sorties) reçoivent toutes les sorties.

## Format de `data.json`

Défini par `StravaData` dans `src/types/strava.ts` et produit par `scripts/fetch-strava.ts` :

```jsonc
{
  "athlete": {
    "id": 1, "firstname": "…", "lastname": "…", "profile": "https://…", "city": "…",
    "cityCenter": [49.05, 2.04]       // centre de la ville (Nominatim), ou null
  },
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
      "kudos": 6,
      "polyline": "o~kiHm…"            // tracé simplifié et rogné (encoded polyline), absent sans GPS
    }
  ],
  "fetchedAt": 1792364030944
}
```

Seuls ces champs sont publiés. Pour la carte, `scripts/fetch-strava.ts` reprend le tracé simplifié que l'API renvoie
avec chaque activité (`map.summary_polyline`, sans requête supplémentaire) et **retire ses 300 premiers et derniers
mètres** (`TRIM_METERS`, `trimEnds` dans `src/lib/polyline.ts`) : les zones de confidentialité Strava ne s'appliquent
pas aux données lues avec son propre jeton, et le départ est souvent le domicile. Ni la position de départ ni le tracé
d'une activité privée ne sont publiés.

Seules les sorties visibles par tous (`visibility: "everyone"`) sont publiées : le scope `activity:read` renvoie aussi
les sorties « Abonnés ».

La ville du profil est convertie en coordonnées par [Nominatim](https://nominatim.org/) (OpenStreetMap), une fois
par synchronisation. Elle ne sert que de repli à la carte quand aucune sortie n'a de tracé.

## Carte

`MapTile` n'utilise pas non plus de bibliothèque : les tuiles du fond OpenStreetMap
(`tile.openstreetmap.org`, sans clé d'API, attribution obligatoire) sont des `<img>` placées selon la projection
Web Mercator (`features/dashboard/lib/map.ts`). Les tracés forment une **heatmap** dessinée sur un canvas
(`features/dashboard/lib/heatmap.ts`) : chaque pixel compte les sorties qui y passent (une sortie qui repasse sur ses
pas ne compte qu'une fois), puis prend la couleur de ce nombre, en échelle logarithmique, sur la palette **magma**
(`--map-heat` dans `global.css`). En thème sombre, elle va du violet au jaune pâle : les passages fréquents sont les
plus lumineux ; en thème clair, sa moitié sombre est inversée, du corail au violet presque noir : ils sont les plus foncés. Une légende donne le maximum visible et le survol affiche le nombre de
passages. Le fond est atténué par un filtre CSS, inversé en thème sombre.
Par défaut, la carte se centre sur la **zone la plus parcourue** de toutes les sorties (`densestCenter`) : les tracés
sont répartis dans une grille de cases d'environ 3 km, chaque case compte les sorties qui la traversent et la fenêtre
de 3 × 3 cases qui en totalise le plus l'emporte. Calculé côté navigateur, ce centre ne dépend pas de la période.
La carte se déplace (glisser, flèches du clavier) et se zoome (+ −, molette) à tout moment :

- hors mode « Personnaliser », c'est de l'exploration, jamais enregistrée ; ⌖ revient à la vue choisie. La molette
  seule fait défiler la page, il faut Ctrl ou ⌘ pour zoomer (une aide s'affiche) ;
- en mode personnalisation, la molette zoome directement et la vue est enregistrée dans les réglages de l'emplacement
  (voir [development.md](development.md#personnaliser-la-disposition)) ; ⌖ revient à la vue par défaut.

## Graphiques

Les graphiques sont dessinés en **SVG à la main**, sans bibliothèque. `useElementSize` mesure le conteneur
(via `ResizeObserver`) et le SVG est recalculé à chaque redimensionnement. Les couleurs viennent des
variables CSS de `src/styles/global.css`, ce qui gère automatiquement le thème sombre.
