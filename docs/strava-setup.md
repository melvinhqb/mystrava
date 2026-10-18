# Configuration Strava

La GitHub Action « Déploiement GitHub Pages » a besoin de trois secrets pour interroger l'API.

## 1. Créer une application Strava

Sur <https://www.strava.com/settings/api>, créez une application avec `localhost` comme
*Authorization Callback Domain*. Notez le **Client ID** et le **Client Secret**.

## 2. Autoriser l'application

Ouvrez cette URL (remplacez `CLIENT_ID`) :

```
https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=read,activity:read
```

Après validation, le navigateur part vers `http://localhost/?state=&code=XXXX&scope=…` (la page en erreur est normale).
Copiez la valeur de `code`.

> Le scope `activity:read` exclut les activités privées (« Moi uniquement ») : elles ne seront jamais publiées.

## 3. Obtenir le refresh token

Le code n'est valable qu'une fois et quelques minutes :

```sh
curl -X POST https://www.strava.com/oauth/token \
  -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET \
  -d code=XXXX -d grant_type=authorization_code
```

Copiez la valeur de `refresh_token` dans la réponse.

## 4. Ajouter les secrets au dépôt

*Settings → Secrets and variables → Actions → New repository secret* :

| Nom | Valeur |
| --- | --- |
| `STRAVA_CLIENT_ID` | Client ID |
| `STRAVA_CLIENT_SECRET` | Client Secret |
| `STRAVA_REFRESH_TOKEN` | refresh token de l'étape 3 |

## 5. Première synchronisation

Onglet *Actions → Déploiement GitHub Pages → Run workflow*. Le workflow récupère les données, construit
le site et le publie. Les données ne sont jamais commitées.

## Dépannage

- **Échec de l'étape « Récupérer les données Strava »** : vérifiez les trois secrets ; rien n'est publié tant
  qu'elle échoue, la version précédente du site reste en ligne.
- **Avertissement « nouveau refresh token »** : Strava a renouvelé le jeton ; mettez à jour le secret
  `STRAVA_REFRESH_TOKEN` avec la nouvelle valeur.
