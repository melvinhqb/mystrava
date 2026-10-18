# Image de l'application : build statique servi par scripts/server.ts, qui rafraîchit data.json.
# Les données Strava ne sont jamais intégrées à l'image : elles sont récupérées au démarrage
# grâce aux secrets STRAVA_* fournis au lancement du conteneur.

# ---------- Build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && rm -f dist/data.json

# ---------- Exécution ----------
# Alpine nu + binaire Node seul : ni npm ni yarn, image plus légère que node:24-alpine.
# La version d'Alpine doit correspondre à celle de node:24-alpine (libc musl).
FROM alpine:3.24
RUN apk add --no-cache libstdc++ \
 && addgroup -S node && adduser -S -G node node
COPY --from=build /usr/local/bin/node /usr/local/bin/node
ENV NODE_ENV=production \
    PORT=8080 \
    STATIC_DIR=/app/dist \
    SYNC_INTERVAL_HOURS=12
WORKDIR /app
# package.json fournit "type": "module" aux scripts TypeScript exécutés par Node.
COPY --chown=node:node package.json ./
COPY --chown=node:node scripts/fetch-strava.ts scripts/server.ts ./scripts/
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "scripts/server.ts"]
