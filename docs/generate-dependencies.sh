#!/usr/bin/env bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Database mermaid diagrams
npm run -w internal/datastore diagrams
cp ./internal/datastore/src/types.md ./docs/assets/diagrams/types.md

# Specifications
npm run generate:html
cp ./sdk/html/index.html ./docs/_includes/components/nhs-notify-supplier-api.html

#Contributing file
cp ./CONTRIBUTING.md ./docs/_includes/components/contributing.md
