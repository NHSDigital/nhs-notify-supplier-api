#!/usr/bin/env bash

set -euo pipefail

install_package() {
  local package=$1
  local tmplog
  tmplog="$(mktemp)"

  pnpm install --no-lockfile "$package" 2>&1 | tee "$tmplog"

  if grep -q 'ERR_PNPM' "$tmplog"; then
    echo "Error: pnpm install failed for $package" >&2
    exit 1
  fi

  pnpm list "$package"
}

# Ensure we have the latest package matching the major version
install_package @nhsdigital/nhs-notify-event-schemas-letter-rendering@^2

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
