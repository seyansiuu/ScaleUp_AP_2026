#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Export the backend database URL first." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql was not found. Install PostgreSQL client tools and retry." >&2
  exit 1
fi

PLAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for plan in q2_baseline q20_baseline q9_baseline; do
  source_file="${PLAN_DIR}/${plan}.sql"
  output_file="${PLAN_DIR}/${plan}.txt"
  if [[ ! -f "$source_file" ]]; then
    echo "Missing plan query: $source_file" >&2
    exit 1
  fi

  : > "$output_file"
  for run in 1 2 3; do
    {
      printf '\n===== %s | Run %s | %s =====\n' "$plan" "$run" "$(date '+%Y-%m-%dT%H:%M:%S%z')"
      psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$source_file"
    } >> "$output_file"
  done
  echo "Saved ${output_file}"
done
