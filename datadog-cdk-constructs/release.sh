set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
VAULT_PREFIX="kv/k8s/gitlab-runner/datadog-cdk-constructs/secrets"

source $SCRIPT_DIR/../utilities/login-github.sh \
  --vault $VAULT_PREFIX \
  --app-id gh_app_id \
  --private-key gh_private_key \
  --installation-id gh_installation_id

source $SCRIPT_DIR/../utilities/login-npm.sh \
  --vault $VAULT_PREFIX \
  --npm-token npm_token

source $SCRIPT_DIR/../utilities/login-pypi.sh \
  --vault $VAULT_PREFIX \
  --pypi-token pypi_token

yarn install
yarn build
