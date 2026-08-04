#!/bin/sh
# Points this example at your own bit.cloud scope.
# Usage: ./setup.sh <your-org>.<your-scope>
set -eu

PLACEHOLDER='CHANGE-ME.CHANGE-ME'
COMPONENT_DIR='components/greeting'
COMPONENT_ID='greeting'

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

echo "==> Step 1 of 4: write the default scope"
if grep -q "\"defaultScope\": \"$PLACEHOLDER\"" workspace.jsonc; then
  sed "s|\"defaultScope\": \"$PLACEHOLDER\"|\"defaultScope\": \"$SCOPE\"|" workspace.jsonc > workspace.jsonc.new
  mv workspace.jsonc.new workspace.jsonc
  echo "workspace.jsonc now uses the scope $SCOPE."
else
  echo 'The placeholder is absent. workspace.jsonc keeps its current scope.'
fi

echo "==> Step 2 of 4: install the dependencies"
bit install

echo "==> Step 3 of 4: track the component"
if [ -f .bitmap ] && grep -q "\"$COMPONENT_ID\"" .bitmap; then
  echo "Bit tracks $COMPONENT_ID already."
else
  bit add "$COMPONENT_DIR" --id "$COMPONENT_ID"
  echo "Bit now tracks $COMPONENT_ID."
fi

echo "==> Step 4 of 4: show the workspace status"
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
   Go to your bit.cloud organization: Settings > Webhooks > Create webhook.
   Event:   Components > Export succeeded
   URL:     https://api.github.com/repos/<owner>/<repo>/dispatches
   Headers: Authorization: Bearer <GitHub token with repo scope>
            Accept: application/vnd.github+json
   Template: Custom, with the body that the README gives.
   A correct delivery returns 204.

4. Export the component one time, so the scope has content.
   Run: bit lane create hello && bit snap -m "first snap" && bit export
   The bit-sync workflow then opens the branch and the pull request.

The README explains each step, and it lists the four flows to test.
CHECKLIST
