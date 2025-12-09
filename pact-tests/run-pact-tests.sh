#!/usr/bin/env bash

set -euo pipefail

# ensure we have the latest package matching the major version
npm install --no-lockfile @nhsdigital/nhs-notify-event-schemas-letter-rendering@^2.0.0

rm -rf ./.pacts

# Generate the pact contracts
jest ./src/consumer

# # Check the pact contracts by running them against the sample events published by the provider
jest ./src/provider --runInBand

rm -rf ../pact-contracts/pacts
mkdir -p ../pact-contracts/pacts
cp -r ./.pacts/. ../pact-contracts/pacts
