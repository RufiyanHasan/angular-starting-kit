# syntax=docker/dockerfile:1

# ---- Build: compile the Angular app ------------------------------------------------------
ARG NODE_VERSION=26
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is cached until package*.json changes.
# --ignore-scripts: skips git hooks (husky) and other install scripts not needed to build.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runtime: static files on nginx, as a non-root user ----------------------------------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Overridable at `docker run`: where the browser may send API requests (CSP connect-src).
ENV CSP_CONNECT_SRC="'self'"

# The nginx image renders /etc/nginx/templates/*.template into conf.d/ with envsubst at start.
COPY docker/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chmod=755 docker/entrypoint.d/40-app-config.sh /docker-entrypoint.d/40-app-config.sh

# Owned by the nginx user so the entrypoint can write assets/config.json from APP_CONFIG_JSON.
COPY --from=build --chown=101:101 /app/dist/angular-starter-kit/browser /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
