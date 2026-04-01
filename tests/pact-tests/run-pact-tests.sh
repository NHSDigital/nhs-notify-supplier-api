#!/usr/bin/env bash

set -euo pipefail

# Ensure we have the latest package matching the major version
npm install --no-lockfile @nhsdigital/nhs-notify-event-schemas-letter-rendering@^2

# Reinstall pact to ensure platform-specific native dependencies are present
# CI may run on a different architectures to local dev
npm install --no-lockfile --include=optional @pact-foundation/pact @pact-foundation/pact-core

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
