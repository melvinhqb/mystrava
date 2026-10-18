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
2. Créez `src/features/dashboard/components/MaTuile.tsx` en vous appuyant sur `Tile` ou `StatTile`.
3. Ajoutez `MaTuile.stories.tsx` et vérifiez le rendu dans Storybook (clair, sombre, mobile).
4. Placez la tuile dans `Dashboard.tsx`.

## Qualité

```sh
npm run lint
npm run typecheck
```

La CI (`.github/workflows/ci.yml`) exécute lint, build et build Storybook sur chaque pull request.
