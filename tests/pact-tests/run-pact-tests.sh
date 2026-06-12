#!/usr/bin/env bash

set -euo pipefail

# Keep pact runs deterministic by relying on the repository lockfile.
# Rebuild optional native bindings for the current platform without resolving new versions.
npm rebuild --include=optional @pact-foundation/pact @pact-foundation/pact-core

# CI runners can restore node_modules generated on a different architecture.
# Ensure Pact's native prebuild for Linux x64 glibc is present before loading pact-core.
if [[ "$(uname -s)" == "Linux" && "$(uname -m)" == "x86_64" ]]; then
  if ! node -e "require.resolve('@pact-foundation/pact-core-linux-x64-glibc')" >/dev/null 2>&1; then
    PACT_CORE_VERSION="$(node -p "(() => { try { return require('@pact-foundation/pact/node_modules/@pact-foundation/pact-core/package.json').version; } catch { return require('@pact-foundation/pact-core/package.json').version; } })()")"
    npm install --no-save --include=optional "@pact-foundation/pact-core-linux-x64-glibc@${PACT_CORE_VERSION}"
  fi
fi

# Remove old PACTs
rm -rf ./.pacts

# Generate the PACT contracts
jest ./pact-tests/consumer

# Check the PACT contracts by running them against the sample events published by the provider
jest ./pact-tests/provider

# Copy over the new consumer PACT contracts to a publishable package
rm -rf ../pact-contracts/pacts
mkdir -p ../pact-contracts/pacts
cp -r ./.pacts/ ../pact-contracts/pacts
