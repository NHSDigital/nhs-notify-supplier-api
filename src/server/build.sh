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

generate_nuget_version

echo "Building Abstractions."
cd abstractions && \
cp ../.version . && \
dotnet restore && \
dotnet build --no-restore --configuration=Release && \
dotnet publish --no-restore --configuration=Release /p:Version=${TEST_NUGET_VERSION} && \
dotnet pack --configuration Release /p:Version=${TEST_NUGET_VERSION} --no-build && \
cd ..


echo "Building Data."
cd data && \
cp ../.version . && \
dotnet restore && \
dotnet build --no-restore --configuration=Release && \
dotnet publish --no-restore --no-build --configuration=Release /p:Version=${TEST_NUGET_VERSION} && \
dotnet pack --configuration Release /p:Version=${TEST_NUGET_VERSION} --no-build && \
cd ..

echo "Building Letter."
cd letter && \
cp ../.version . && \
dotnet restore && \
dotnet build --no-restore --configuration=Release && \
dotnet publish --no-restore --no-build --configuration=Release /p:Version=${TEST_NUGET_VERSION} && \
dotnet pack --configuration Release /p:Version=${TEST_NUGET_VERSION} --no-build && \
cd ..

echo "Building Host."
cd host && \
cp ../.version . && \
dotnet restore && \
dotnet build --no-restore --configuration=Release && \
dotnet publish --no-restore --no-build --configuration=Release /p:Version=${TEST_NUGET_VERSION} && \
dotnet pack --configuration Release /p:Version=${TEST_NUGET_VERSION} --no-build && \
cd ..
