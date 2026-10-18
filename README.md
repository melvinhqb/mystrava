<div align="center">

<img src="public/favicon.svg" width="64" height="64" alt="">

# MyStrava

**Tableau de bord public de mes performances en course à pied, alimenté par l'API Strava.**

[![Déploiement](https://github.com/melvinhqb/mystrava/actions/workflows/deploy.yml/badge.svg)](https://github.com/melvinhqb/mystrava/actions/workflows/deploy.yml)

[Site](https://melvinhqb.github.io/mystrava/) · [Storybook](https://melvinhqb.github.io/mystrava/storybook/)

</div>

---

Une page statique en style **bento**, responsive, claire ou sombre selon le système, aux couleurs de Strava (`#FC4C02`).
Les données sont récupérées deux fois par jour par une GitHub Action au moment du déploiement : elles ne sont
jamais commitées dans le dépôt, et aucun secret ni connexion n'est nécessaire côté visiteur.

## Fonctionnalités

- **Indicateurs de la période** (30 j, 90 j, 1 an ou tout) : distance, sorties, temps, allure, dénivelé, comparés à la période précédente
- **Tendances** : volume hebdomadaire sur 12 semaines, tendance sur 26 semaines, allure moyenne mois par mois
- **Records** : plus longue sortie, allure la plus rapide (≥ 5 km), plus gros dénivelé, meilleure semaine
- **Régularité** : semaines consécutives avec au moins une sortie
- **Calendrier** des sorties sur un an, jours de sortie préférés, répartition des distances
- **Dernières sorties** (liens vers Strava) et totaux de l'athlète
- **Données de démo** en dev : sans `data.json` local, l'app affiche des données fictives

Seules les activités `Run`, `TrailRun` et `VirtualRun` publiques sont prises en compte, sans tracé GPS ni position.

## Stack

| | |
| --- | --- |
| Interface | [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vite.dev) |
| Composants | [Storybook](https://storybook.js.org) (+ addon accessibilité) |
| Qualité | ESLint, `tsc` en mode strict |
| Données | API Strava → `data.json` généré au déploiement (jamais commité) |
| Hébergement | GitHub Pages |

## Démarrage rapide

Prérequis : **Node.js ≥ 20.19** (22 recommandé, voir `.nvmrc`).

```sh
npm install
npm run dev          # http://localhost:5173 — données de démo
npm run sync         # optionnel : tes vraies données Strava (secrets dans .env)
npm run storybook    # http://localhost:6006
```

| Script | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Vérification des types + build de production dans `dist/` |
| `npm run preview` | Sert le build de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification des types seule |
| `npm run storybook` | Storybook en développement |
| `npm run build-storybook` | Build statique de Storybook dans `dist/storybook/` |
| `npm run sync` | Récupère les données Strava dans `public/data.json` (secrets dans `.env`, voir `.env.example`) |

## Structure

```
src/
├── app/            # Composant racine
├── api/            # Chargement de data.json et données de démo
├── components/
│   ├── ui/         # Briques génériques (Tile, StatTile, BarChart…)
│   └── layout/     # Topbar, Footer, WelcomeScreen
├── features/
│   └── dashboard/  # Tuiles du tableau de bord et calculs statistiques
├── hooks/          # Hooks React partagés
├── lib/            # Utilitaires purs (dates, formatage)
├── stories/        # Introduction, fixtures et décorateurs Storybook
├── styles/         # CSS global et variables de thème
└── types/          # Types du format data.json
scripts/
└── fetch-strava.ts # Synchronisation avec l'API Strava
```

Détails dans [docs/architecture.md](docs/architecture.md).

## Documentation

- [Architecture](docs/architecture.md) — organisation du code, flux de données, conventions
- [Développement et Storybook](docs/development.md) — travailler sur l'interface, écrire des stories
- [Configuration Strava](docs/strava-setup.md) — créer l'application Strava et les secrets du dépôt
- [Déploiement](docs/deployment.md) — GitHub Actions et GitHub Pages
