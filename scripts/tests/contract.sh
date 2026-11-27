#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

pnpm --filter @sap/contracts-provider run test:contracts
