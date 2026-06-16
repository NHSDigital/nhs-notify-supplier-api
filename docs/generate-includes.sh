#!/usr/bin/env bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

mkdir -p ./docs/_includes/components/generated

# Database mermaid diagrams
# NOTE: This also regenerates internal/datastore/src/types.md as a side effect.
# Review any changes to that file before committing.
npm run -w internal/datastore diagrams
cp ./internal/datastore/src/types.md ./docs/_includes/components/generated/types.md

#Contributing file
cp ./CONTRIBUTING.md ./docs/_includes/components/generated/contributing.md

# Function documentation (lambdas)
mkdir -p ./docs/_includes/components/generated/readmes
cp ./lambdas/api-handler/README.md ./docs/_includes/components/generated/readmes/lambda-api-handler.md
cp ./lambdas/authorizer/README.md ./docs/_includes/components/generated/readmes/lambda-authorizer.md
cp ./lambdas/supplier-allocator/README.md ./docs/_includes/components/generated/readmes/lambda-supplier-allocator.md
cp ./lambdas/upsert-letter/README.md ./docs/_includes/components/generated/readmes/lambda-upsert-letter.md
cp ./lambdas/update-letter-queue/README.md ./docs/_includes/components/generated/readmes/lambda-update-letter-queue.md
cp ./lambdas/letter-updates-transformer/README.md ./docs/_includes/components/generated/readmes/lambda-letter-updates-transformer.md
cp ./lambdas/mi-updates-transformer/README.md ./docs/_includes/components/generated/readmes/lambda-mi-updates-transformer.md
cp ./lambdas/supplier-config-ingress/README.md ./docs/_includes/components/generated/readmes/lambda-supplier-config-ingress.md

# Function documentation (internal packages)
cp ./internal/datastore/README.md ./docs/_includes/components/generated/readmes/internal-datastore.md
cp ./internal/events/README.md ./docs/_includes/components/generated/readmes/internal-events.md
cp ./internal/event-builders/README.md ./docs/_includes/components/generated/readmes/internal-event-builders.md
cp ./internal/helpers/README.md ./docs/_includes/components/generated/readmes/internal-helpers.md

# Function documentation (other)
cp ./tests/README.md ./docs/_includes/components/generated/readmes/tests-overview.md
cp ./sandbox/README.md ./docs/_includes/components/generated/readmes/sandbox.md
cp ./config/suppliers/README.md ./docs/_includes/components/generated/readmes/config-suppliers.md
