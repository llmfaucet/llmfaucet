#!/usr/bin/env bash
set -euo pipefail
probe_dir="${PROBE_DIR:-/opt/llmfaucet-probe}"
install -d -m 0750 "$probe_dir"
echo "Deploy apps/probe artifacts to $probe_dir, then restart llmfaucet-probe."
