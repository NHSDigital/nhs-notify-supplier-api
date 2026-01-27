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
  TGZ_NAME=$(npm pack "$PKG" --pack-destination .packages)
  tar -xvzf ".packages/$TGZ_NAME" -C ".contracts/$PKG" --strip-components=1
done

npx jest --runInBand
