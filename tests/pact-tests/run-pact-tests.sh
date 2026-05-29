#!/usr/bin/env bash

set -euo pipefail

# Keep pact runs deterministic by relying on the repository lockfile.
# Rebuild optional native bindings for the current platform without resolving new versions.
npm rebuild --include=optional @pact-foundation/pact @pact-foundation/pact-core

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
