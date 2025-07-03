#!/bin/sh

docker run -p 80:8080 -e SWAGGER_JSON=/swagger/swagger.json -v ../specification/api/notify-supplier.yml:/swagger/swagger.json docker.swagger.io/swaggerapi/swagger-ui
