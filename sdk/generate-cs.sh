#!/bin/sh
# run this from directory above, or with npm run generate:ts from parent directory.

VERSION=${1:-"$(cat .version)"}

generate () {
  set -x
  docker run \
  --rm \
  --user $(id -u) \
  -v ${PWD}:/local \
  -e VERSION="$SHORT_VERSION" \
  openapitools/openapi-generator-cli \
  generate \
  -i /local/build/notify-supplier.yml \
  -g csharp \
  --additional-properties="packageName=nhsnotifysupplier,packageVersion=$SHORT_VERSION,licenseId=MIT,targetFramework=net8.0" \
  -o /local/sdk/csharp \
  --skip-validate-spec
  set +x
}

build () {
  dotnet build sdk/csharp/src/nhsnotifysupplier --configuration Release
}

generate_nuget_version(){
  echo $VERSION
  echo $SHORT_VERSION
  echo $NUGET_VERSION
  SHORT_NUGET_VERSION="$(echo $NUGET_VERSION | rev | cut -d"." -f2-  | rev)"
  echo $SHORT_NUGET_VERSION
  SHORTER_NUGET_VERSION="$(echo $SHORT_NUGET_VERSION | rev | cut -d"." -f2-  | rev)"
  echo $SHORTER_NUGET_VERSION
  TEST_NUGET_VERSION="$(echo $NUGET_VERSION | sed -E 's/.([^.]*)$/\1/')"
  TEST_NUGET_VERSION="$(echo $TEST_NUGET_VERSION | sed -E 's/.([^.]*)$/\1/')"
  echo $TEST_NUGET_VERSION
}

pack(){


  generate_nuget_version

  dotnet \
  pack sdk/csharp/src/nhsnotifysupplier \
  --configuration Release \
  /p:Version=${TEST_NUGET_VERSION} \
  --no-build \
  --output sdk/csharp

}
prepare(){
  mkdir -p sdk/csharp
  echo $VERSION

  SHORT_VERSION="$(echo $VERSION | rev | cut -d"." -f2-  | rev)"
  echo $SHORT_VERSION

  NUGET_VERSION="$(echo "$VERSION" | tr + .)"
  echo $NUGET_VERSION
}

echo $VERSION
prepare
generate
build
pack
