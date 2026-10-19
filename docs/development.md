# Développement et Storybook

## Lancer le projet

```sh
npm install
npm run dev
```

`http://localhost:5173/` charge `public/data.json` s'il existe (créé par `npm run sync`, ignoré par git),
sinon les **données de démo** (`src/api/demo.ts`). Pour revenir à la démo, supprimez `public/data.json`.

Ce repli n'existe qu'en dev : en prod, le générateur de démo n'est pas inclus dans le bundle et l'absence
de `data.json` affiche l'écran d'accueil.

## Variables d'environnement

L'application elle-même n'en utilise aucune : elle lit seulement `public/data.json`.

Seul le script de synchronisation (`npm run sync`) a besoin des secrets Strava. Pour rafraîchir les vraies
données en local :

```sh
cp .env.example .env   # puis renseignez les trois valeurs (voir strava-setup.md)
npm run sync
```

`.env` est ignoré par git et chargé par le script avec `process.loadEnvFile()` (Node ≥ 20.12).
Les variables déjà définies dans l'environnement ont la priorité : c'est ainsi que la GitHub Action
fournit les secrets du dépôt. On peut aussi les passer directement :
`STRAVA_CLIENT_ID=… STRAVA_CLIENT_SECRET=… STRAVA_REFRESH_TOKEN=… npm run sync`.

> Ne créez pas de variables `VITE_*` contenant des secrets : Vite les intègre en clair dans le bundle publié.

## Storybook

```sh
npm run storybook   # http://localhost:6006
```

Storybook sert de **catalogue de l'interface** : chaque composant y est visible dans ses différents états,
ce qui permet de suivre l'UI/UX sans avoir à reproduire les situations dans l'application.
Il est publié avec le site sur [`/storybook/`](https://melvinhqb.github.io/mystrava/storybook/).

Sections :

- **Introduction** — organisation et palette de couleurs (`src/stories/Introduction.mdx`)
- **UI** — briques génériques
- **Layout** — structure de page
- **Dashboard** — chaque tuile, et la page complète (`Dashboard › Page Complete`)

Addons :

- **Docs** : une page de documentation est générée pour chaque composant (`tags: ['autodocs']`), à partir des types et commentaires JSDoc des props.
- **Accessibility** : l'onglet du même nom signale les problèmes de contraste, de rôles ARIA, etc.
- **Viewport** (intégré) : bouton de la barre d'outils pour tester les largeurs mobile / tablette.

### Écrire une story

Les stories sont placées **à côté du composant** :

```tsx
// src/features/dashboard/components/MaTuile.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { lastDays } from '@/stories/fixtures';
import { withBento } from '@/stories/decorators';
import { MaTuile } from './MaTuile';

const meta = {
  title: 'Dashboard/MaTuile',
  component: MaTuile,
  decorators: [withBento(4)], // grille bento à 4 colonnes, comme dans l'app
  args: { runs: lastDays(90) },
} satisfies Meta<typeof MaTuile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
export const SansSortie: Story = { args: { runs: [] } };
```

Outils partagés dans `src/stories/` :

| Fichier | Contenu |
| --- | --- |
| `fixtures.ts` | `demoData`, `demoRuns`, `lastDays(n)`, `withoutHeartRate(runs)` |
| `decorators.tsx` | `withBento(colonnes, largeurMax)` |

Couvrez au minimum l'état nominal, l'état vide et les cas limites (noms longs, absence de cardio…).

## Ajouter une tuile au tableau de bord

1. Ajoutez le calcul dans `src/features/dashboard/lib/stats.ts` (fonction pure).
2. Créez `src/features/dashboard/components/MaTuile.tsx` en vous appuyant sur `Tile` ou `StatTile`,
   avec une prop `size` typée par les formats qu'elle sait afficher (ex. `size?: '2:1'`) et transmise à `Tile`.
3. Ajoutez `MaTuile.stories.tsx` et vérifiez le rendu dans Storybook (clair, sombre, mobile).
4. Déclarez le bloc dans `src/features/dashboard/blocks.tsx` (`label`, `sizes` et `render`).
5. Placez-le dans la disposition `src/features/dashboard/layout.ts`.

## Personnaliser la disposition

La grille est assemblée *as code* dans `src/features/dashboard/layout.ts` : une liste ordonnée de blocs,
chacun avec un format `colonnes:lignes` sur une grille de 4 colonnes (`1:1`, `2:1`, `1:2`, `2:2`, `4:1`…).
Toutes les lignes ont la même hauteur (`--row` dans `global.css` : 200 px, 150 px sur mobile) et toutes les
colonnes la même largeur : deux tuiles qui occupent autant de lignes ou de colonnes ont exactement la même taille,
quel que soit leur contenu. Une tuile `1:1` est donc toujours plus large que haute, et c'est au contenu de
s'adapter au format (les listes affichent autant d'éléments entiers que la place le permet).

```ts
export const defaultLayout: DashboardLayout = [
  { block: 'distance', size: '2:2' },
  { block: 'kpi-runs' },            // sans `size` : le premier format du bloc
  { block: 'streak', size: '4:1' },
];
```

Les formats acceptés par chaque bloc sont déclarés dans `blocks.tsx` ; TypeScript refuse un format qu'un bloc
ne supporte pas. Sur tablette et mobile, les tuiles larges sont ramenées à la largeur de l'écran.

`defaultLayout` est la disposition par défaut. Dans l'application, le bouton **Personnaliser** permet aussi
de la modifier à la manière d'un écran d'accueil de téléphone :

- **×** retire un widget, la tuile **+ Ajouter un widget** ouvre le catalogue des widgets absents, dans chacun de leurs formats ;
- les tuiles se déplacent par glisser-déposer, ou avec les flèches ← → de leur barre d'outils ;
- les boutons ↔ − + et ↕ − + passent au format voisin en largeur ou en hauteur, parmi ceux que le bloc supporte ;
- la **carte** se déplace (glisser ou flèches du clavier) et se zoome (molette, + −) : la vue affichée devient sa vue par défaut ; ⌖ revient au centre automatique, la zone la plus parcourue. Hors personnalisation, la carte s'explore aussi, sans rien enregistrer.

Un bloc peut ainsi avoir des **réglages** propres à son emplacement (`options` dans la disposition, typés par bloc) :
il les déclare avec `parseOptions` dans `blocks.tsx`, qui relit aussi les sauvegardes, et les reçoit dans `render`
avec `editing` et `onOptionsChange`.

```ts
{ block: 'map', size: '4:2', options: { center: [49.05, 2.04], zoom: 13 } }
```

Cette disposition personnalisée est enregistrée dans le navigateur (`localStorage`, clé `running.layout`) ;
**Réinitialiser** revient à `defaultLayout`. Une sauvegarde est relue avec tolérance (`parseLayout`) :
les blocs disparus sont ignorés et les formats qui ne sont plus supportés reviennent au format par défaut.

Chaque widget se décline en **small** (`1:1`, l'essentiel), **medium** (`2:1`, + un graphique)
et **large** (`2:2`, + des détails), quand son contenu s'y prête.

| Bloc | Formats | Bloc | Formats |
| --- | --- | --- | --- |
| `distance` | `1:1`, `2:1`, `2:2` | `heart-rate` | `1:1`, `2:1` |
| `pace` | `1:1`, `2:1`, `2:2` | `streak` | `1:1`, `2:1`, `2:2`, `4:1` |
| `kpi-runs` | `1:1` | `weekday` | `1:1` |
| `kpi-time` | `1:1` | `distance-buckets` | `1:1` |
| `kpi-elevation` | `1:1` | `recent-runs` | `2:2` |
| `records` | `1:2` | `totals` | `2:1` |
| `map` | `2:2`, `1:1`, `4:2` | | |

## Qualité

```sh
npm run lint
npm run typecheck
```

La CI (`.github/workflows/ci.yml`) exécute lint, build et build Storybook sur chaque pull request.
