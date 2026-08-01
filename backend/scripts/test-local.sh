#!/usr/bin/env bash
#
# Run the backend suite against the LOCAL Supabase stack instead of remote dev.
#
# Why: the remote pooler (aws-1-eu-west-1) answers in ~46ms. The suite issues about
# 10,000 statements, so 96% of a 436s run is the process sitting idle on the network
# (measured: real 438s vs 17.7s CPU). Locally that same work is sub-millisecond.
#
# Nothing here touches the remote database. `supabase start` builds a throwaway
# Postgres from the migration files in supabase/migrations/.
#
# Usage:
#   ./scripts/test-local.sh                      # whole suite
#   ./scripts/test-local.sh tests/service        # a subset
#   ./scripts/test-local.sh -k taxonomy -x       # any pytest args pass through
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Docker Desktop does not always put its CLI on PATH, and the Supabase CLI talks to
# the socket directly anyway — so check the socket rather than the binary.
if [ ! -S /var/run/docker.sock ] && [ ! -S "$HOME/.docker/run/docker.sock" ]; then
  echo "error: Docker does not appear to be running (no docker.sock)." >&2
  echo "       Start Docker Desktop, then re-run." >&2
  exit 1
fi

if ! supabase status >/dev/null 2>&1; then
  echo "==> local Supabase not running, starting it (first run pulls images)"
  supabase start
fi

# Export ANON_KEY / API_URL / DB_URL / SERVICE_ROLE_KEY etc. from the running stack.
eval "$(supabase status -o env)"

# The app reads these; `load_dotenv(override=False)` means a real environment
# variable beats backend/.env, so no code change is needed to switch targets.
export DATABASE_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
export SUPABASE_URL="${API_URL:-http://127.0.0.1:54321}"
export SUPABASE_ANON_KEY="${ANON_KEY:?supabase status did not report ANON_KEY}"
export SUPABASE_SERVICE_ROLL_KEY="${SERVICE_ROLE_KEY:?supabase status did not report SERVICE_ROLE_KEY}"

echo "==> target: $SUPABASE_URL  (local — remote dev is untouched)"

# AI tests stay skipped without --run-ai; pass it through if you really want them.
exec .venv/bin/pytest "$@"
