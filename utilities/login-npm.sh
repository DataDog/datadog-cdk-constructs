#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: login-npm.sh [--vault VAULT_PREFIX] [--npm-token VAULT_NAME_FOR_NPM_TOKEN]" 1>&2
  echo ""
  echo "  --vault VAULT_PREFIX                              The Vault path prefix where secrets are stored (e.g., kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)"
  echo "  --npm-token VAULT_NAME_FOR_NPM_TOKEN              The Vault field name for the NPM token (e.g., npm_token)"
  echo "  --help, -h                                        Show this help message"
  exit 1
}

VAULT_PREFIX=""
NPM_TOKEN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      [[ $# -ge 2 ]] || usage
      VAULT_PREFIX="$2"
      shift 2
      ;;
    --npm-token)
      [[ $# -ge 2 ]] || usage
      NPM_TOKEN="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      echo "Unknown option: $1" 1>&2
      usage
      ;;
  esac
done


# Validate required inputs
if [[ -z "$NPM_TOKEN" || -z "$VAULT_PREFIX" ]]; then
  echo "Missing required inputs. Provide --vault, --npm-token." 1>&2
  usage
fi

if [[ -z "${CI:-}" ]]; then
  VAULT_ADDR="https://vault.us1.ddbuild.io"
fi

NPM_TOKEN_VAL=$(VAULT_ADDR=$VAULT_ADDR vault kv get -field="$NPM_TOKEN" "$VAULT_PREFIX")

yarn config set npmAuthToken "$NPM_TOKEN_VAL" --silent
