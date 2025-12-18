#!/usr/bin/env bash

set -euo pipefail

npm config ls -l | grep '/npm.pkg.github.com/:_authToken' -q && echo "Github token already exists" && exit 0

if [ -z "${GITHUB_TOKEN:-}" ]; then
    read -p "Enter GitHub token: " GITHUB_TOKEN
    export GITHUB_TOKEN
fi

npm config --location user set //npm.pkg.github.com/:_authToken $GITHUB_TOKEN
