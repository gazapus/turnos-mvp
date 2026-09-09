#!/usr/bin/env bash
# Cloud Agent install phase for turnos-mvp.
# Idempotent bootstrap: dependencies, Prisma client, local PostgreSQL, migrations and dev seed.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16
DB_NAME=turnos_mvp
DB_USER=postgres
DB_PASSWORD=root

log() { printf '\n[cloud-install] %s\n' "$1"; }

log "Ensuring local .env files exist"
[ -f packages/database/.env ] || cp packages/database/.env.example packages/database/.env
[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env

log "Installing PostgreSQL if missing"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq "postgresql-${PG_VERSION}" postgresql-contrib
fi

log "Starting PostgreSQL cluster ${PG_VERSION}/main"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

log "Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then break; fi
  sleep 1
done

log "Ensuring role password and database"
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
fi

log "Installing workspace dependencies"
pnpm install --frozen-lockfile

log "Generating Prisma client and building @turnos/database"
pnpm --filter @turnos/database build

log "Applying database migrations"
pnpm --filter @turnos/database exec prisma migrate deploy

log "Seeding development data"
pnpm --filter @turnos/database db:seed

log "Install complete"
