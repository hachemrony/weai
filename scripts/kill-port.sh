#!/usr/bin/env bash
set -euo pipefail
PORT="${1:-3000}"

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [ -n "${PIDS}" ]; then
    echo "Killing PIDs on port ${PORT}: ${PIDS}"
    kill -9 ${PIDS} || true
  else
    echo "No process on port ${PORT}"
  fi
else
  # fallback Linux-only
  fuser -k "${PORT}/tcp" || true
fi
