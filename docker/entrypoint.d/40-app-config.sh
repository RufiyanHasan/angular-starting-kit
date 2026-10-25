#!/bin/sh
# Runs at container start (nginx image convention: /docker-entrypoint.d/*.sh).
# One image, many environments: pass the whole runtime config as an env var,
#   docker run -e APP_CONFIG_JSON="$(cat config.prod.json)" …
# or mount a file over /usr/share/nginx/html/assets/config.json instead.
set -eu

CONFIG=/usr/share/nginx/html/assets/config.json

if [ -n "${APP_CONFIG_JSON:-}" ]; then
  printf '%s\n' "$APP_CONFIG_JSON" > "$CONFIG"
  echo "40-app-config: wrote $CONFIG from APP_CONFIG_JSON"
fi

if grep -q '"mockApi": *true' "$CONFIG"; then
  echo "40-app-config: WARNING mockApi is true; the app serves fake data from the browser" >&2
fi
