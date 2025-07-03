BASE_URL ?= "/"
VERSION ?= ""
SHELL = /bin/bash

build: version # Build the project artefact @Pipeline
	cd .. && npm run build && cd sdk

clean: # Clean-up project resources (main) @Operations
	rm -rf */

swagger:
	./swagger.sh

version:
	touch _config.version.yml
	if [[ $(VERSION) == "" ]]; then \
		(cd .. && make version); \
		ver=$$(head -n 1 ../.version 2> /dev/null || echo unknown); \
		echo "version: $$ver" > _config.version.yml; \
		echo "$$ver" > .version; \
	else \
		echo "version: $(VERSION)" > _config.version.yml; \
		echo "$(VERSION)" > .version; \
	fi

	echo "{ \"schemaVersion\": 1, \"label\": \"version\", \"message\": \"$$(head -n 1 .version 2> /dev/null || echo unknown)\", \"color\": \"orange\" }" > version.json
