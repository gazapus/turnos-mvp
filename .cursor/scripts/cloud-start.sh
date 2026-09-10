#!/usr/bin/env bash
# Cloud Agent start phase for turnos-mvp.
# Per-boot reconciliation: ensure the local PostgreSQL cluster is running, then
# launch the development servers (Next.js web + NestJS API via Turborepo).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

PG_VERSION=16

log() { printf '\n[cloud-start] %s\n' "$1"; }

wait_ready() {
  for _ in $(seq 1 30); do
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

log "Starting PostgreSQL cluster ${PG_VERSION}/main"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

if ! wait_ready; then
  log "PostgreSQL not ready; attempting restart (clears stale pid/socket)"
  sudo pg_ctlcluster "${PG_VERSION}" main restart 2>/dev/null || true
  wait_ready || { log "PostgreSQL did not become ready"; exit 1; }
fi
log "PostgreSQL is ready"

log "Starting development servers (pnpm dev)"
exec pnpm dev
