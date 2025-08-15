#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: login-pypi.sh [--vault VAULT_PREFIX] [--pypi_token VAULT_NAME_FOR_PYPI_TOKEN]" 1>&2
  echo ""
  echo "  --vault VAULT_PREFIX                              The Vault path prefix where secrets are stored (e.g., kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)"
  echo "  --pypi-token VAULT_NAME_FOR_PYPI_TOKEN            The Vault field name for the PyPi token (e.g., pypi_token)"
  echo "  --help, -h                                        Show this help message"
  exit 1
}

VAULT_PREFIX=""
PYPI_TOKEN=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      [[ $# -ge 2 ]] || usage
      VAULT_PREFIX="$2"
      shift 2
      ;;
    --pypi-token)
      [[ $# -ge 2 ]] || usage
      PYPI_TOKEN="$2"
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
if [[ -z "$PYPI_TOKEN" || -z "$VAULT_PREFIX" ]]; then
  echo "Missing required inputs. Provide --vault, --pypi_token." 1>&2
  usage
fi

if [[ -z "${CI:-}" ]]; then
  VAULT_ADDR="https://vault.us1.ddbuild.io"
fi

PYPI_TOKEN_VAL=$(VAULT_ADDR=$VAULT_ADDR vault kv get -field="$PYPI_TOKEN" "$VAULT_PREFIX")

rm -f ~/.pypirc
echo "[pypi]" >> ~/.pypirc
echo "username = __token__" >> ~/.pypirc
echo "password = $PYPI_TOKEN_VAL" >> ~/.pypirc
