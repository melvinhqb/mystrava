# MyStrava

Tableau de bord de mes performances en course à pied, en style **bento**, responsive et aux couleurs Strava (`#FC4C02`). Les données viennent de l'**API Strava**.

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

## Démarrage

Node.js 18 ou plus, aucune dépendance à installer.

1. Créez une application Strava sur <https://www.strava.com/settings/api> et indiquez `localhost` comme *Authorization Callback Domain*.
2. Copiez `.env.example` vers `.env` et renseignez `STRAVA_CLIENT_ID` et `STRAVA_CLIENT_SECRET`.
3. Lancez :

   ```sh
   npm start
   ```

4. Ouvrez <http://localhost:3000> et cliquez sur **Se connecter avec Strava**.

Pour tester sans compte : <http://localhost:3000/?demo> (données fictives).

## Fonctionnement

- `server.js` gère l'OAuth Strava (le `client_secret` ne quitte jamais le serveur), rafraîchit le jeton automatiquement et expose `/api/dashboard`. Les sessions sont en mémoire : il faut se reconnecter après un redémarrage du serveur.
- Les activités sont récupérées par pages de 200 (2 000 au plus, pour respecter les limites de l'API Strava : 100 requêtes / 15 min) et mises en cache 10 minutes. Le bouton ↻ force une nouvelle synchronisation.
- `public/` contient la page : la grille bento (`styles.css`), le calcul des statistiques et les graphiques SVG (`app.js`), et le générateur de données de démo (`demo.js`). La page suit le thème clair ou sombre du système.
