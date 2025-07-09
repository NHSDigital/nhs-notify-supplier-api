#! /bin/sh
VERSION=${1:-"$(cat .version)"}

generate_nuget_version(){
  echo "GENERATING NUGET VERSION"
  SHORT_VERSION="$(echo $VERSION | rev | cut -d"." -f2-  | rev)"
  NUGET_VERSION="$(echo "$VERSION" | tr + .)"

  echo "VERSION: $VERSION"
  echo "SHORT: $SHORT_VERSION"
  echo "NUGET: $NUGET_VERSION"
  SHORT_NUGET_VERSION="$(echo $NUGET_VERSION | rev | cut -d"." -f2-  | rev)"
  echo "SHORT NUGET: $SHORT_NUGET_VERSION"
  SHORTER_NUGET_VERSION="$(echo $SHORT_NUGET_VERSION | rev | cut -d"." -f2-  | rev)"
  echo "SHORTER NUGET: $SHORTER_NUGET_VERSION"
  TEST_NUGET_VERSION="$(echo $NUGET_VERSION | sed -E 's/.([^.]*)$/\1/')"
  TEST_NUGET_VERSION="$(echo $TEST_NUGET_VERSION | sed -E 's/.([^.]*)$/\1/')"
  echo "TEST NUGET VERSION: $TEST_NUGET_VERSION"
}


build(){
  echo "0000 $0"
  echo "1111 $1"
  name=$1
  echo "Building $name"
  cd $name
  pwd
  cp ../.version .
  echo "Root Dir:"
  ls -la
  echo "Cleaning..."
  dotnet clean
  echo "Restoring..."
  dotnet restore /p:Version=${TEST_NUGET_VERSION}
  echo "Building..."
  dotnet build --no-restore --configuration Release /p:Version=${TEST_NUGET_VERSION}
  echo "Publishing..."
  dotnet publish --no-restore --no-build --configuration Release /p:Version=${TEST_NUGET_VERSION}
  echo "Packing..."
  dotnet pack --configuration Release /p:Version=${TEST_NUGET_VERSION} --no-build
  echo "Release Dir :"
  ls -la bin/Release
  echo "net8.0 Dir :"
  ls -la bin/Release/net8.0
  echo "publish Dir :"
  ls -la bin/Release/net8.0/publish
  cd ..
}

generate_nuget_version
build "abstractions"
build "data"
build "letter"
build "host"
