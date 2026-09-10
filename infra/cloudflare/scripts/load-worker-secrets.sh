#!/usr/bin/env bash
set -euo pipefail

# Loads only Worker secrets. Public vars belong in wrangler.toml; Pages build
# vars belong in GitHub repository Variables. Never source the whole .env:
# OCI/SSH values may be multiline and are not Worker credentials.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
env_file="${1:-$repo_root/.env}"
environment="${2:-preview}"

if [[ ! -f "$env_file" ]]; then
  echo "env file not found: $env_file" >&2
  exit 1
fi
if [[ "$environment" != "preview" && "$environment" != "production" ]]; then
  echo "environment must be preview or production" >&2
  exit 2
fi

secrets=(
  BUDGET_HASH_SECRET IP_HASH_SECRET SESSION_HMAC_SECRET OAUTH_STATE_SECRET
  GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GITHUB_SESSION_SECRET
  GITHUB_SPONSORS_WEBHOOK_SECRET GITHUB_PUBLIC_READ_TOKEN ADMIN_GITHUB_LOGINS
)

get_value() {
  local name="$1"
  awk -v name="$name" -F= '$1 == name { sub(/^[^=]*=/, ""); print; exit }' "$env_file"
}

for name in "${secrets[@]}"; do
  value="$(get_value "$name")"
  if [[ -z "$value" ]]; then
    echo "skip $name (not set)"
    continue
  fi
  printf '%s' "$value" | pnpm --dir "$repo_root" exec wrangler secret put "$name" \
    --env "$environment" --config apps/worker/wrangler.toml
  echo "loaded $name for $environment"
done
