#!/bin/sh
# run this from directory above, or with npm run generate:ts from parent directory.

VERSION="$(cat .version)"
echo $VERSION

set -x
docker run \
--rm \
--user $(id -u) \
 -v ${PWD}:/local \
 -e VERSION="$VERSION" \
 openapitools/openapi-generator-cli \
 generate \
 -i /local/specification/api/notify-supplier.yml \
 -g typescript \
 --additional-properties="npmRepository=https://npm.pkg.github.com,npmName=@NHSDigital/nhsnotifysupplier,npmVersion=$VERSION,licenseName=MIT" \
 -o /local/sdk/typescript \
 --skip-validate-spec
set +x

sed -i -e 's|https://github.com/GIT_USER_ID/GIT_REPO_ID.git|https://github.com/NHSDigital/nhs-notify-supplier-api.git|g'  ./sdk/typescript/package.json

sed -i -e 's|OpenAPI client for nhsnotifysupplier|NHS Notify Supplier SDK|g'  ./sdk/typescript/package.json
sed -i -e 's|OpenAPI-Generator Contributors|NHS Notify|g'  ./sdk/typescript/package.json

echo $VERSION
