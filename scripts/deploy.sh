#!/usr/bin/env bash
# Deploy the hosting sites.
#
# Staging is the default so that a routine command can never reach the live
# service. Production requires the word "production" as the first argument,
# and then waits five seconds with that fact on screen before proceeding.
set -euo pipefail

TARGET="${1:-staging}"

if [ "$TARGET" = "production" ]; then
  echo "About to deploy to PRODUCTION (the live service). Press Ctrl-C within 5s to abort."
  sleep 5
  exec npx firebase deploy --only hosting --project production
fi

echo "Deploying to STAGING."
exec npx firebase deploy --only hosting --project staging
