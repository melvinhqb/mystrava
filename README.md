# MyStrava

Tableau de bord de mes performances en course à pied, en style **bento**, responsive et aux couleurs Strava (`#FC4C02`). Les données viennent de l'**API Strava**. Le site est 100 % statique et déployé avec **GitHub Pages** depuis `main`.

## Statistiques affichées

- Distance, nombre de sorties, temps de course, allure moyenne et dénivelé, comparés à la période précédente (30 j, 90 j, 1 an ou tout)
- Volume hebdomadaire sur 12 semaines et tendance sur 26 semaines
- Évolution de l'allure moyenne mois par mois
- Records : plus longue sortie, allure la plus rapide (≥ 5 km), plus gros dénivelé, meilleure semaine
- Régularité : semaines consécutives avec au moins une sortie
- Fréquence cardiaque moyenne
- Calendrier des sorties sur un an, jours de sortie préférés, répartition des distances
- Dernières sorties (avec lien vers Strava) et totaux de l'athlète (`/athletes/{id}/stats`)

Seules les activités `Run`, `TrailRun` et `VirtualRun` sont prises en compte.

## Connexion à Strava

1. Créez une application sur <https://www.strava.com/settings/api> avec comme *Authorization Callback Domain* le domaine du site (`melvinhqb.github.io`, ou `localhost` en local).
2. Ouvrez le site, collez le **Client ID** et le **Client Secret** de l'application, puis cliquez sur **Se connecter avec Strava**.

GitHub Pages ne permet pas d'exécuter de serveur : l'échange OAuth se fait donc directement depuis le navigateur. Les identifiants de l'application et les jetons sont stockés dans le `localStorage` du navigateur, jamais dans le dépôt. « Déconnexion » efface les jetons et les données en cache.

Pour tester sans compte, ajoutez `?demo` à l'URL (données fictives).

## Fonctionnement

- `index.html` : structure de la grille bento.
- `styles.css` : style bento, thème clair et sombre, points de rupture responsive (4, 2 puis 1 colonne).
- `app.js` : OAuth Strava et rafraîchissement automatique du jeton, récupération des activités (pages de 200, 2 000 au plus pour respecter les limites de l'API : 100 requêtes / 15 min), cache de 10 minutes, calcul des statistiques et graphiques SVG. Le bouton ↻ force une nouvelle synchronisation.
- `demo.js` : générateur de données de démonstration.

En local : `python3 -m http.server 8000`, puis ouvrez <http://localhost:8000>.
