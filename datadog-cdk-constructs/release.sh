set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
VAULT_PREFIX="kv/k8s/gitlab-runner/datadog-cdk-constructs/secrets"

VERSION=$1

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

# git remote set-url origin https://github.com/DataDog/datadog-cdk-constructs.git
echo "Setting git remote URL!"

# git remote set-url origin "https://x-access-token:$GH_TOKEN@github.com/DataDog/datadog-cdk-constructs.git"
git config --global user.name "gitlab-actions[bot]"
git config --global user.email "gitlab-actions[bot]@users.noreply.github.com"
git config --global remote.origin.url "https://x-access-token:$GH_TOKEN@github.com/DataDog/datadog-cdk-constructs.git"

yarn install
yarn build

# JS Publishing
JS_TARBALL_PATH=./dist/js/datadog-cdk-constructs-v2@$VERSION.jsii.tgz
yarn publish $JS_TARBALL_PATH --new-version "$VERSION" --registry https://registry.npmjs.org/ --verbose

# Python Publishing
# python3 -m twine upload -u __token__ ./dist/python/*

# Go Publishing


GITHUB_TOKEN=$GH_TOKEN npx -p publib@latest publib-golang

# Create the github release
# gh release create -d "v2-$VERSION" --generate-notes
