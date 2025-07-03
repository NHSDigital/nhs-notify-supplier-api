#! /bin/sh

VERSION=5.26.0
wget https://github.com/swagger-api/swagger-ui/archive/refs/tags/v$VERSION.zip -O swagger.zip
mkdir -p swagger
rm -r swagger/*

unzip swagger.zip "swagger-ui-$VERSION/dist/*" -d swagger
mv swagger/swagger-ui-$VERSION/dist/* swagger
rm -r swagger/swagger-ui-$VERSION
cp swagger-initializer.js swagger/swagger-initializer.js
cp ../specification/api/notify-supplier.yml swagger/swagger.json
rm swagger.zip
