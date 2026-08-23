#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/../.."
[[ -f "$ROOT/MANIFEST.json" ]] || { echo "MANIFEST.json is missing" >&2; exit 1; }
declare -a NAMES=(freellmapi litellm ai-horde pollinations gpt4free)
for name in "${NAMES[@]}"; do
  dir="$ROOT/$name"
  [[ -d "$dir/.git" ]] || { echo "[error] missing clone: $name" >&2; exit 1; }
  [[ -z "$(git -C "$dir" status --porcelain)" ]] || { echo "[error] $name has local modifications" >&2; exit 1; }
  old="$(git -C "$dir" rev-parse HEAD)"
  git -C "$dir" fetch --depth 1 origin HEAD >/dev/null
  git -C "$dir" merge --ff-only FETCH_HEAD >/dev/null
  new="$(git -C "$dir" rev-parse HEAD)"
  printf '[update] %-12s %s -> %s\n' "$name" "${old:0:7}" "${new:0:7}"
done
node - "$ROOT/MANIFEST.json" <<'NODE'
const fs = require('node:fs');
const path = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
manifest.generatedAt = new Date().toISOString();
for (const repo of manifest.repositories) {
  const { execFileSync } = require('node:child_process');
  repo.commit = execFileSync('git', ['-C', repo.directory, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}
fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
NODE
