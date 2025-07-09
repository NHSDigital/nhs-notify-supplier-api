BASE_URL ?= "/"
VERSION ?= ""
SHELL = /bin/bash

clean:
	find . -type d -name 'bin' -exec rm -rf "{}" +
	find . -type d -name 'obj' -exec rm -rf "{}" +

build: clean version #VER=$$(cat .version) # Build the project artefact @Pipeline
	VER=$$(cat .version) && \
	echo $$VER && \
	./build.sh $$VER

version:
	touch _config.version.yml
	if [[ $(VERSION) == "" ]]; then \
		(cd ../.. && make version); \
		ver=$$(head -n 1 ../../.version 2> /dev/null || echo unknown); \
		echo "version: $$ver" > _config.version.yml; \
		echo "$$ver" > .version; \
	else \
		echo "version: $(VERSION)" > _config.version.yml; \
		echo "$(VERSION)" > .version; \
	fi

	echo "{ \"schemaVersion\": 1, \"label\": \"version\", \"message\": \"$$(head -n 1 .version 2> /dev/null || echo unknown)\", \"color\": \"orange\" }" > version.json
