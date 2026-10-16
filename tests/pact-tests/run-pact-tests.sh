#!/usr/bin/env bash

set -euo pipefail

# Keep pact runs deterministic by relying on the repository lockfile.
# Rebuild native bindings for the current platform without resolving new versions.
pnpm rebuild @pact-foundation/pact @pact-foundation/pact-core

# CI runners can restore node_modules generated on a different architecture.
# Ensure Pact's native prebuild for Linux x64 glibc is present before loading pact-core.
# The prebuild package has no "main", so check for its directory beside pact-core.
has_pact_prebuild() {
  node -e "const p = require('path'); process.exit(require('fs').existsSync(p.join(p.dirname(require.resolve('@pact-foundation/pact-core/package.json')), '..', 'pact-core-linux-x64-glibc', 'prebuilds')) ? 0 : 1)" >/dev/null 2>&1
}

if [[ "$(uname -s)" == "Linux" && "$(uname -m)" == "x86_64" ]]; then
  if ! has_pact_prebuild; then
    echo "Pact Linux x64 prebuild missing; reinstalling optional dependencies from the lockfile"
    pnpm install --frozen-lockfile --force
    if ! has_pact_prebuild; then
      echo "ERROR: @pact-foundation/pact-core-linux-x64-glibc is still missing after reinstall" >&2
      exit 1
    fi
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
