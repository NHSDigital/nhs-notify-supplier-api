#!/usr/bin/env bash

published_version=$(npm view @nhsdigital/notify-supplier-api-consumer-contracts --json 2>/dev/null | jq -r '.["dist-tags"].latest')

set -euo pipefail

# Fail if there are uncommitted changes as this indicates unexpected changes to the contracts
git diff --quiet tests/pact-tests

local_version=$(cat pact-contracts/package.json | jq -r '.version')

branch=$(git branch --show-current)

if [[ ! $branch == "feature/CCM-13038_pact-tests" ]]; then
    echo "Not publishing package because this is not the main branch"
    exit 0
fi

if [[ $local_version == $published_version ]]; then
    echo "Local version is the same as the latest published version - skipping publish"
    exit 0
fi

echo "Local version is different to the latest published version - publishing new version"
npm pack ./pact-contracts
