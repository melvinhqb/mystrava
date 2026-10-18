# MyStrava

Page publique de mes performances en course à pied, en style **bento**, responsive et aux couleurs Strava (`#FC4C02`). Le site est statique et déployé avec **GitHub Pages** depuis `main`.

## Fonctionnement

```
GitHub Action (2×/jour)  ──API Strava──▶  data.json (commité sur main)  ──▶  GitHub Pages  ──▶  index.html
     secrets du dépôt
```

- `.github/workflows/strava.yml` exécute `scripts/fetch-strava.mjs` deux fois par jour (et à la demande). Le script utilise les secrets du dépôt pour interroger l'API Strava et écrit `data.json`, commité seulement si les données ont changé.
- La page (`index.html`, `styles.css`, `app.js`) lit `data.json` : aucun secret ni connexion côté visiteur.
- Seuls les champs nécessaires sont publiés (nom, date, distance, durée, dénivelé, vitesse, FC moyenne, kudos) : ni tracé GPS ni position.
- `?demo` à la fin de l'URL affiche des données fictives (`demo.js`).

## Configuration des secrets

1. **Créer une application Strava** sur <https://www.strava.com/settings/api>, avec `localhost` comme *Authorization Callback Domain*. Notez le **Client ID** et le **Client Secret**.

2. **Autoriser l'application** en ouvrant cette URL (remplacez `CLIENT_ID`) :

   ```
   https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read
   ```

   Après validation, le navigateur part vers `http://localhost/?state=&code=XXXX&scope=…` (la page en erreur est normale). Copiez la valeur de `code`.

   Le scope `activity:read` exclut les activités privées (« Moi uniquement ») : elles ne seront jamais publiées.

3. **Obtenir le refresh token** (le code n'est valable qu'une fois et quelques minutes) :

   ```sh
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET \
     -d code=XXXX -d grant_type=authorization_code
   ```

   Copiez la valeur de `refresh_token` dans la réponse.

4. **Ajouter les secrets** dans le dépôt GitHub : *Settings → Secrets and variables → Actions → New repository secret* :

   | Nom | Valeur |
   | --- | --- |
   | `STRAVA_CLIENT_ID` | Client ID |
   | `STRAVA_CLIENT_SECRET` | Client Secret |
   | `STRAVA_REFRESH_TOKEN` | refresh token de l'étape 3 |

5. **Lancer la première synchronisation** : onglet *Actions → Synchronisation Strava → Run workflow*. Une fois `data.json` commité, GitHub Pages republie le site.

Si l'action échoue au moment du `git push`, vérifiez dans *Settings → Actions → General → Workflow permissions* que l'écriture est autorisée, et que `main` n'est pas protégée contre les pushes de `github-actions[bot]`.

## Statistiques affichées

- Distance, nombre de sorties, temps de course, allure moyenne et dénivelé, comparés à la période précédente (30 j, 90 j, 1 an ou tout)
- Volume hebdomadaire sur 12 semaines et tendance sur 26 semaines
- Évolution de l'allure moyenne mois par mois
- Records : plus longue sortie, allure la plus rapide (≥ 5 km), plus gros dénivelé, meilleure semaine
- Régularité : semaines consécutives avec au moins une sortie
- Fréquence cardiaque moyenne
- Calendrier des sorties sur un an, jours de sortie préférés, répartition des distances
- Dernières sorties (avec lien vers Strava) et totaux de l'athlète

Seules les activités `Run`, `TrailRun` et `VirtualRun` sont prises en compte.

## En local

```sh
STRAVA_CLIENT_ID=… STRAVA_CLIENT_SECRET=… STRAVA_REFRESH_TOKEN=… node scripts/fetch-strava.mjs
python3 -m http.server 8000   # puis http://localhost:8000
```
