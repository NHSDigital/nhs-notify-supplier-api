#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TESTS_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$TESTS_ROOT"

rm -rf .packages .contracts
mkdir -p .packages

# Use local tarball if available (for development), otherwise fetch from npm
CORE_CONTRACTS_LOCAL="${CORE_CONTRACTS_LOCAL:-}"

if [[ -n "$CORE_CONTRACTS_LOCAL" && -f "$CORE_CONTRACTS_LOCAL" ]]; then
  echo "Using local core consumer contracts: $CORE_CONTRACTS_LOCAL"
  PKG_NAME="@nhsdigital/notify-core-consumer-contracts"
  mkdir -p ".contracts/$PKG_NAME"
  tar -xvzf "$CORE_CONTRACTS_LOCAL" -C ".contracts/$PKG_NAME" --strip-components=1
else
  CONSUMER_PACKAGES=(
    "@nhsdigital/notify-core-consumer-contracts"
  )

  for PKG in "${CONSUMER_PACKAGES[@]}"; do
    mkdir -p ".contracts/$PKG"
    TGZ_NAME=$(npm pack "$PKG" --pack-destination .packages)
    tar -xvzf ".packages/$TGZ_NAME" -C ".contracts/$PKG" --strip-components=1
  done
fi

npx jest --runInBand
