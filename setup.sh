#!/bin/sh
# Points this example at your own bit.cloud scope.
# Usage: ./setup.sh <your-org>.<your-scope>
set -eu

# The four components that this repository mirrors, in dependency order.
COMPONENTS='utils/format-price models/cart-item ui/price-tag ui/cart-summary'

cd "$(dirname "$0")"

SCOPE="${1:-}"

if [ -z "$SCOPE" ]; then
  echo 'Error: the scope id is missing.' >&2
  echo 'Usage: ./setup.sh <your-org>.<your-scope>' >&2
  echo 'Example: ./setup.sh acme.shop' >&2
  exit 1
fi

# A scope id has two parts and one dot. Reject every other shape.
if ! printf '%s\n' "$SCOPE" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9_-]*\.[A-Za-z0-9][A-Za-z0-9_-]*$'; then
  echo "Error: '$SCOPE' is not a scope id." >&2
  echo 'A scope id is <your-org>.<your-scope>, for example acme.shop.' >&2
  exit 1
fi

if ! command -v bit > /dev/null 2>&1; then
  echo 'Error: the bit command is not on your PATH.' >&2
  echo 'Install Bit first: npx @teambit/bvm install' >&2
  exit 1
fi

# The scope that the committed .bitmap mirrors, and the package prefix that
# the component sources import. Both change when you fork.
MIRRORED_SCOPE="$(sed -n 's/^ *"scope": *"\([^"]*\)".*/\1/p' .bitmap 2>/dev/null | head -1 || true)"
# The env of the mirrored components. The env lives in the .bitmap config,
# so a fresh `bit add` must name it again, or the components fall back to
# the default node env and lose their React tooling.
COMPONENT_ENV="$(sed -n 's/^ *"env": *"\([^"]*\)".*/\1/p' .bitmap 2>/dev/null | head -1 || true)"
COMPONENT_ENV="${COMPONENT_ENV:-bitdev.react/react-env}"
ORG="${SCOPE%%.*}"
NAME="${SCOPE#*.}"
NEW_PREFIX="@$ORG/$NAME."

echo "==> Step 1 of 5: write the default scope"
if grep -q "\"defaultScope\": \"$SCOPE\"" workspace.jsonc; then
  echo "workspace.jsonc uses the scope $SCOPE already."
else
  sed "s|\"defaultScope\": \"[^\"]*\"|\"defaultScope\": \"$SCOPE\"|" workspace.jsonc > workspace.jsonc.new
  mv workspace.jsonc.new workspace.jsonc
  echo "workspace.jsonc now uses the scope $SCOPE."
fi

echo "==> Step 2 of 5: fork the components into your scope"
if [ -n "$MIRRORED_SCOPE" ] && [ "$MIRRORED_SCOPE" != "$SCOPE" ]; then
  # The committed .bitmap records versions that belong to the mirrored
  # scope. Your scope has none of them, so the four components start again
  # as new components under your scope.
  OLD_ORG="${MIRRORED_SCOPE%%.*}"
  OLD_NAME="${MIRRORED_SCOPE#*.}"
  OLD_PREFIX="@$OLD_ORG/$OLD_NAME."
  echo "The repository mirrors $MIRRORED_SCOPE. Rewriting it to $SCOPE."
  find components -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.mdx' \) -print0 \
    | xargs -0 sed -i.bak "s|$OLD_PREFIX|$NEW_PREFIX|g"
  find components -name '*.bak' -delete
  echo "Imports now use the package prefix $NEW_PREFIX."
  rm -f .bitmap
  bit init
  for id in $COMPONENTS; do
    bit add "components/$id" --id "$id" --env "$COMPONENT_ENV"
  done
  echo "Bit now tracks the four components as new components of $SCOPE, on the env $COMPONENT_ENV."
elif [ -f .bitmap ]; then
  echo "The .bitmap file mirrors $SCOPE already. There is nothing to fork."
else
  # No .bitmap at all: a copy of the files without the mirror state.
  bit init
  for id in $COMPONENTS; do
    bit add "components/$id" --id "$id" --env "$COMPONENT_ENV"
  done
  echo "Bit now tracks the four components as new components of $SCOPE, on the env $COMPONENT_ENV."
fi

echo "==> Step 3 of 5: install the dependencies"
# The install runs after the add on purpose. `bit install` resolves the
# dependencies of every tracked component and compiles it. An install that
# runs first leaves the new components with "missing packages" and
# "missing dists" issues in the status below.
bit install

echo "==> Step 4 of 5: run the tests"
bit test --unmodified

echo "==> Step 5 of 5: show the workspace status"
bit status

cat <<'CHECKLIST'

==> The workspace is ready. Four manual steps remain.

1. Create the repository secret BIT_CONFIG_ACCESS_TOKEN.
   Go to Settings > Secrets and variables > Actions > New repository secret.
   The value is a bit.cloud token of a service account.
   The account must have write permission on your scope.
   Get the token with: bit login --machine-name ci
   Never commit the token, and never print it in a workflow.

2. Permit the workflows to open a pull request.
   Go to Settings > Actions > General > Workflow permissions.
   Select "Allow GitHub Actions to create and approve pull requests".
   If this setting is off, the sync run fails when it opens the pull request.

3. Create the bit.cloud webhook.
   Go to your scope on bit.cloud: Settings > Webhooks > Create webhook.
   Event:   Components > Export succeeded
   URL:     https://api.github.com/repos/<owner>/<repo>/dispatches
   Headers: Authorization: Bearer <GitHub token with repo scope>
            Accept: application/vnd.github+json
   Template: Custom, with the body that the README gives.
   A correct delivery returns 204.

4. Release the four components to your scope, then commit the result.
   Run: bit tag -m "first version" && bit export
   Then: git add -A && git commit -m "chore: mirror <your-scope>" && git push
   Your scope's main now holds the four components, and the committed
   .bitmap records their versions. The sync starts from a converged state.

The README explains each step, and it lists the four flows to test.
CHECKLIST
