# syntax=docker/dockerfile:1.7
# Build depuis la racine du dépôt : docker build -f deploy/Dockerfile -t carnet-entretien .

ARG NODE_VERSION=22-bookworm-slim

FROM node:${NODE_VERSION} AS build
WORKDIR /app
# Outils de compilation en secours si le binaire précompilé de better-sqlite3 est indisponible
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    TZ=Europe/Paris
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends tzdata \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /data && chown node:node /data
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/drizzle ./drizzle
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server/index.js"]
