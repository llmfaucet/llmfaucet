#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
image="openapitools/openapi-generator-cli:v7.25.0"
spec="/local/openapi/llmfaucet.yaml"
command="${1:-generate}"

case "$command" in
  validate)
    docker run --rm -v "$repo_root:/local" "$image" validate -i "$spec"
    ;;
  generate)
    mkdir -p "$repo_root/openapi/generated/typescript-fetch"
    docker run --rm --user "$(id -u):$(id -g)" -v "$repo_root:/local" "$image" generate \
      -i "$spec" \
      -g typescript-fetch \
      -o /local/openapi/generated/typescript-fetch \
      --global-property apis,models,supportingFiles \
      --additional-properties=useSingleRequestParameter=true,supportsES6=true,npmName=@llmfaucet/openapi-client,npmVersion=0.1.0,typescriptThreePlus=true
    ;;
  *)
    echo "usage: $0 [validate|generate]" >&2
    exit 2
    ;;
esac
