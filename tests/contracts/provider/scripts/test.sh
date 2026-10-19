#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
TESTS_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$TESTS_ROOT"

rm -rf .packages .contracts
mkdir -p .packages

CONSUMER_PACKAGES=(
  "@nhsdigital/notify-core-consumer-contracts"
)

for PKG in "${CONSUMER_PACKAGES[@]}"; do
  mkdir -p ".contracts/$PKG"
  pnpm add --dir .packages --ignore-workspace --ignore-scripts --save-exact "$PKG"
  PACKAGE_DIR=".packages/node_modules/$PKG"
  TGZ_PATH=$(cd "$PACKAGE_DIR" && pnpm pack --json --pack-destination "$TESTS_ROOT/.packages" | jq -r '.filename')
  tar -xvzf "$TGZ_PATH" -C ".contracts/$PKG" --strip-components=1
done

pnpm exec jest --runInBand
