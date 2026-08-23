#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare -a NAMES=(freellmapi litellm ai-horde pollinations gpt4free)
declare -a URLS=(
  https://github.com/tashfeenahmed/freellmapi.git
  https://github.com/BerriAI/litellm.git
  https://github.com/Haidra-Org/AI-Horde.git
  https://github.com/pollinations/pollinations.git
  https://github.com/xtekky/gpt4free.git
)
for i in "${!NAMES[@]}"; do
  name="${NAMES[$i]}"; dir="$ROOT/$name"
  if [[ ! -d "$dir/.git" ]]; then
    git clone --depth 1 --no-tags "${URLS[$i]}" "$dir" >/dev/null
  else
    [[ -z "$(git -C "$dir" status --porcelain)" ]] || { echo "[error] $name has local modifications" >&2; exit 1; }
    git -C "$dir" fetch --depth 1 origin HEAD >/dev/null
    git -C "$dir" merge --ff-only FETCH_HEAD >/dev/null
  fi
  printf '[ok] %-12s %s\n' "$name" "$(git -C "$dir" rev-parse --short HEAD)"
done
