#!/usr/bin/env bash
# Restaura un respaldo generado por backup.sh.
# Uso: ./scripts/restore.sh archivo.dump
# ADVERTENCIA: sobrescribe los datos actuales de la base indicada en DATABASE_URL.
# Si pg_restore no está instalado localmente, usa el contenedor "postgres" de
# docker-compose automáticamente.

set -euo pipefail

DIR_SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR_RAIZ="$(cd "$DIR_SCRIPT/../../.." && pwd)"
ARCHIVO="${1:-}"

if [ -z "$ARCHIVO" ] || [ ! -f "$ARCHIVO" ]; then
  echo "Uso: ./scripts/restore.sh ruta/al/respaldo.dump"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$DIR_SCRIPT/../.env" ]; then
  export $(grep -v '^#' "$DIR_SCRIPT/../.env" | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Falta DATABASE_URL (defínela en apps/api/.env o expórtala antes de correr este script)."
  exit 1
fi

read -p "Esto sobrescribe los datos actuales de la base. ¿Continuar? (escribe 'si'): " CONFIRMAR
if [ "$CONFIRMAR" != "si" ]; then
  echo "Cancelado."
  exit 0
fi

if command -v pg_restore >/dev/null 2>&1; then
  pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$ARCHIVO"
else
  echo "pg_restore no está instalado localmente; usando el contenedor de docker-compose…"
  docker compose -f "$DIR_RAIZ/docker-compose.yml" exec -T postgres \
    pg_restore --clean --if-exists --no-owner -U guapa -d guapa_gourmet < "$ARCHIVO"
fi

echo "Restauración completa desde: $ARCHIVO"
