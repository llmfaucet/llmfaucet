#!/usr/bin/env bash
set -euo pipefail

source_file="${1:?usage: load-env.sh /path/to/.env}"
target_dir="${PROBE_ENV_DIR:-/opt/llmfaucet}"
target_file="$target_dir/.env"

[[ -f "$source_file" ]] || { echo "env file not found: $source_file" >&2; exit 1; }
install -d -m 0750 "$target_dir"
install -m 0600 "$source_file" "$target_file"

required=(PROBE_INTERVAL_MS CF_ACCOUNT_ID CF_API_TOKEN CF_KV_NAMESPACE_ID CF_D1_DATABASE_ID)
for name in "${required[@]}"; do
  grep -Eq "^${name}=.+$" "$target_file" || {
    echo "missing required Oracle probe variable: $name" >&2
    exit 1
  }
done

if command -v systemctl >/dev/null 2>&1 && systemctl cat llmfaucet-probe.service >/dev/null 2>&1; then
  systemctl restart llmfaucet-probe.service
fi
echo "installed $target_file with mode 0600"
