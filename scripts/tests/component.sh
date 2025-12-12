#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# run tests
cd tests
TEST_EXIT_CODE=0
npm ci
npm run test:component || TEST_EXIT_CODE=$?
echo "TEST_EXIT_CODE=$TEST_EXIT_CODE"

mkdir -p ../acceptance-test-report
cp -r ./playwright-report ../acceptance-test-report
[[ -e test-results ]] && cp -r ./test-results ../acceptance-test-report

exit $TEST_EXIT_CODE
