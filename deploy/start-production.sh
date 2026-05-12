#!/usr/bin/env bash
set -euo pipefail

cd /var/www/jornal

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export NODE_ENV=production
exec node server/index.js
