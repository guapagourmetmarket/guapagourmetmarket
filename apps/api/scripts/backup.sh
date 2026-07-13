#!/usr/bin/env bash
# Respaldo de la base de datos de Guapa Gourmet Market.
# Uso: ./scripts/backup.sh [carpeta-destino]
# Si pg_dump no está instalado en la máquina, usa automáticamente el contenedor
# "postgres" de docker-compose (así funciona sin instalar Postgres aparte).

set -euo pipefail

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_RAIZ="$(cd "$DIR_SCRIPT/../../.." && pwd)"
DESTINO="${1:-$DIR_SCRIPT/../backups}"
mkdir -p "$DESTINO"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$DIR_SCRIPT/../.env" ]; then
  export $(grep -v '^#' "$DIR_SCRIPT/../.env" | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Falta DATABASE_URL (defínela en apps/api/.env o expórtala antes de correr este script)."
  exit 1
fi

ARCHIVO="$DESTINO/guapa-gourmet-$(date +%Y%m%d-%H%M%S).dump"

if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --format=custom --file="$ARCHIVO" "$DATABASE_URL"
else
  echo "pg_dump no está instalado localmente; usando el contenedor de docker-compose…"
  docker compose -f "$DIR_RAIZ/docker-compose.yml" exec -T postgres \
    pg_dump --format=custom -U guapa guapa_gourmet > "$ARCHIVO"
fi

echo "Respaldo guardado en: $ARCHIVO"
