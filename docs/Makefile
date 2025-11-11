BASE_URL ?= "/"
VERSION ?= ""
SHELL = /bin/bash
SDK_DIR := ../sdk

default: install

h help:
	@egrep '^\S|^$$' Makefile

install:
	npm install
	bundle config set --local path vendor/bundle
	bundle install

s serve:
	bundle exec jekyll serve --trace --livereload

define baseurlparam =
$(if $(BASE_URL),-- --baseurl $(BASE_URL),-- --baseurl "")
endef

build: version .generate-includes $(SDK_DIR)/build
	rsync -a --delete $(SDK_DIR)/swagger/ ./assets/swagger
	npm run build $(baseurlparam)

debug: version .generate-includes $(SDK_DIR)/build
	rsync -a --delete $(SDK_DIR)/swagger/ ./assets/swagger
	npm run debug

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

.generate-includes:
	npm run generate-includes

$(SDK_DIR)/build:
	$(MAKE) -C $(SDK_DIR) build
