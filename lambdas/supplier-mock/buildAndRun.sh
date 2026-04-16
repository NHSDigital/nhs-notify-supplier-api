#!/bin/bash

npm run lambda-build
sam build
sam local invoke SupplierMockFunction --event event.json
