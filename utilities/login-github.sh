#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: login-github.sh [--vault VAULT_PREFIX] [--app-id VAULT_NAME_FOR_APP_ID] [--private-key VAULT_NAME_FOR_PRIVATE_KEY] [--installation-id VAULT_NAME_FOR_INSTALLATION_ID]" 1>&2
  echo ""
  echo "  --vault VAULT_PREFIX                              The Vault path prefix where secrets are stored (e.g., kv/k8s/gitlab-runner/serverless-remote-instrumentation/secrets)"
  echo "  --app-id VAULT_NAME_FOR_APP_ID                    The Vault field name for the GitHub App ID (e.g., gh_app_id)"
  echo "  --private-key VAULT_NAME_FOR_PRIVATE_KEY          The Vault field name for the GitHub App private key (e.g., gh_private_key)"
  echo "  --installation-id VAULT_NAME_FOR_INSTALLATION_ID  The Vault field name for the GitHub App installation ID (e.g., gh_installation_id)"
  echo "  --help, -h                                        Show this help message"
  exit 1
}

VAULT_PREFIX=""
APP_ID=""
PRIVATE_KEY=""
INSTALLATION_ID=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)
      [[ $# -ge 2 ]] || usage
      VAULT_PREFIX="$2"
      shift 2
      ;;
    --app-id)
      [[ $# -ge 2 ]] || usage
      APP_ID="$2"
      shift 2
      ;;
    --private-key)
      [[ $# -ge 2 ]] || usage
      PRIVATE_KEY="$2"
      shift 2
      ;;
    --installation-id)
      [[ $# -ge 2 ]] || usage
      INSTALLATION_ID="$2"
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
if [[ -z "$APP_ID" || -z "$INSTALLATION_ID" || -z "$PRIVATE_KEY" || -z "$VAULT_PREFIX" ]]; then
  echo "Missing required inputs. Provide --vault, --app-id, --private-key, --installation-id." 1>&2
  usage
fi

if [[ -z "${CI:-}" ]]; then
  VAULT_ADDR="https://vault.us1.ddbuild.io"
fi

export GH_APP_ID=$(VAULT_ADDR=$VAULT_ADDR vault kv get -field="$APP_ID" "$VAULT_PREFIX")
export GH_PRIVATE_KEY=$(VAULT_ADDR=$VAULT_ADDR vault kv get -field="$PRIVATE_KEY" "$VAULT_PREFIX")
export GH_INSTALLATION_ID=$(VAULT_ADDR=$VAULT_ADDR vault kv get -field="$INSTALLATION_ID" "$VAULT_PREFIX")

# Write private key to a temporary file
PRIVATE_KEY_FILE=$(mktemp)
echo "$GH_PRIVATE_KEY" > "$PRIVATE_KEY_FILE"

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
export JWT_TOKEN=$(bash "$SCRIPT_DIR/generate_jwt.sh" "$GH_APP_ID" "$PRIVATE_KEY_FILE")

rm -f "$PRIVATE_KEY_FILE"

export GH_TOKEN=$(curl -s -X POST \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/app/installations/$GH_INSTALLATION_ID/access_tokens" | jq -r '.token')

gh auth status
