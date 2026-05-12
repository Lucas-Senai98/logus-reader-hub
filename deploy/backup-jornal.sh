#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/jornal}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/jornal}"
DATE="$(date +%Y-%m-%d_%H-%M-%S)"
TARGET="${BACKUP_DIR}/jornal-${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"
mkdir -p "${APP_DIR}/server/data" "${APP_DIR}/server/uploads/pdfs"

if [[ ! -f "${APP_DIR}/server/data/edicoes.json" ]]; then
  printf '[]\n' > "${APP_DIR}/server/data/edicoes.json"
fi

tar -czf "$TARGET" \
  -C "$APP_DIR" \
  server/data/edicoes.json \
  server/uploads/pdfs

find "$BACKUP_DIR" -type f -name "jornal-*.tar.gz" -mtime +30 -delete

echo "$TARGET"
