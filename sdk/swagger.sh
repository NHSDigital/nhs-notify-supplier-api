#!/bin/sh
set -eux

docker run -p 80:8080 -e SWAGGER_JSON=/swagger/swagger.yml -v ../build/notify-supplier.yml:/swagger/swagger.yml docker.swagger.io/swaggerapi/swagger-ui
