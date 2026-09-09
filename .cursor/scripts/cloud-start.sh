#!/usr/bin/env bash
# Cloud Agent start phase for turnos-mvp.
# Per-boot reconciliation: ensure the local PostgreSQL cluster is running and ready.
set -euo pipefail

PG_VERSION=16

log() { printf '\n[cloud-start] %s\n' "$1"; }

log "Starting PostgreSQL cluster ${PG_VERSION}/main"
sudo pg_ctlcluster "${PG_VERSION}" main start 2>/dev/null || true

log "Waiting for PostgreSQL to accept connections"
for _ in $(seq 1 30); do
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    log "PostgreSQL is ready"
    exit 0
  fi
  sleep 1
done

log "PostgreSQL did not become ready in time"
exit 1
