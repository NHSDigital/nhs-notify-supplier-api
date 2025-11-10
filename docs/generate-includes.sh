#!/usr/bin/env bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

mkdir -p ./docs/_includes/components/generated

# Database mermaid diagrams
npm run -w internal/datastore diagrams
cp ./internal/datastore/src/types.md ./docs/_includes/components/generated/types.md

#Contributing file
cp ./CONTRIBUTING.md ./docs/_includes/components/generated/contributing.md
