# This file is for you! Edit it to implement your own hooks (make targets) into
# the project as automated steps to be executed on locally and in the CD pipeline.

include scripts/init.mk

# ==============================================================================

# Example CI/CD targets are: dependencies, build, publish, deploy, clean, etc.

dependencies: # Install dependencies needed to build and test the project @Pipeline
	# TODO: Implement installation of your project dependencies

build: # Build the project artefact @Pipeline
	(cd sdk && make build)
	(cd docs && make build)
# Take out for now - might add again in the future
# (cd server && make build)
#	(cd src/server && make build)
publish: # Publish the project artefact @Pipeline
	# TODO: Implement the artefact publishing step

deploy: # Deploy the project artefact to the target environment @Pipeline
	# TODO: Implement the artefact deployment step

clean:: # Clean-up project resources (main) @Operations
	rm -f .version
	(cd sdk && make clean)
# Take out for now - might add again in the future
# (cd server && make clean)
# (cd src/server && make clean)

guard-%:
	@if [ -z "$${$*}" ]; then \
		echo "Variable $* not set"; \
		echo "Usage: make <target> $*=<env>"; \
		exit 1; \
	fi
serve:
	npm run serve

lint-oas:
	npm run lint-oas

publish-oas:
	$(MAKE) copy-examples
	npm run publish-oas

set-authorization: guard-APIM_ENV
	SPEC_DIR=./specification/api/components/environments
	COMPONENT_DIR=./specification/api/components/parameters/authorization
	./scripts/build/substitute_build_env.sh $$COMPONENT_DIR/authorization-template.yml $$SPEC_DIR/$$APIM_ENV.env $$COMPONENT_DIR/authorization.yml

set-nhsd-apim: guard-APIM_ENV
	SPEC_DIR=./specification/api/components/environments
	COMPONENT_DIR=./specification/api/components/x-nhsd-apim
	./scripts/build/substitute_build_env.sh $$COMPONENT_DIR/x-nhsd-apim-template.yml $$SPEC_DIR/$$APIM_ENV.env $$COMPONENT_DIR/x-nhsd-apim.yml

set-security: guard-APIM_ENV
	SPEC_DIR=./specification/api/components/environments
	COMPONENT_DIR=./specification/api/components/security
	./scripts/build/substitute_build_env.sh $$COMPONENT_DIR/security-template.yml $$SPEC_DIR/$$APIM_ENV.env $$COMPONENT_DIR/security.yml
	COMPONENT_DIR=./specification/api/components/security-schemes
	./scripts/build/substitute_build_env.sh $$COMPONENT_DIR/security-schemes-template.yml $$SPEC_DIR/$$APIM_ENV.env $$COMPONENT_DIR/security-schemes.yml


construct-spec: guard-APIM_ENV
	$(MAKE) set-nhsd-apim APIM_ENV=$$APIM_ENV
	$(MAKE) set-authorization APIM_ENV=$$APIM_ENV
	$(MAKE) set-security APIM_ENV=$$APIM_ENV

build-json-oas-spec: guard-APIM_ENV
	$(MAKE) construct-spec APIM_ENV=$$APIM_ENV
	$(MAKE) publish-oas

build-yml-oas-spec: guard-APIM_ENV
	$(MAKE) construct-spec APIM_ENV=$$APIM_ENV
	$(MAKE) bundle-oas

serve-oas:
	$(MAKE) copy-examples
	npm run serve-oas

bundle-oas:
	$(MAKE) copy-examples
	npm run bundle-oas

generate-sandbox:
	$(MAKE) build-json-oas-spec APIM_ENV=sandbox
	# jq --slurpfile status sandbox/HealthcheckEndpoint.json '.paths += $$status[0]' build/notify-supplier.json > tmp.json && mv tmp.json build/notify-supplier.json
	jq '.security = []' build/notify-supplier.json > tmp.json && mv tmp.json build/notify-supplier.json
	npm run generate-sandbox

serve-swagger:
	npm run serve-swagger-docs

copy-examples:
	@scripts/build/copy-examples.sh

config:: _install-dependencies version # Configure development environment (main) @Configuration
	npm install
	(cd docs && make install && cd ..)

test-component:
	(cd tests && npm install && npm run test:component)

test-performance:
	(cd tests && npm install && npm run test:performance)

test-contract: # Run provider contract tests @Testing
	npm run test:contracts --workspace tests/contracts/provider

version:
	rm -f .version
	make version-create-effective-file dir=.
	echo "{ \"schemaVersion\": 1, \"label\": \"version\", \"message\": \"$$(head -n 1 .version 2> /dev/null || echo unknown)\", \"color\": \"orange\" }" > version.json
# ==============================================================================

${VERBOSE}.SILENT: \
	build \
	clean \
	config \
	dependencies \
	deploy \

#####################
# E2E Test commands #
#####################

TEST_CMD := APIGEE_ACCESS_TOKEN="$(APIGEE_ACCESS_TOKEN)" \
	PYTHONPATH=. poetry run pytest --disable-warnings -vv \
	--color=yes \
	-n 4 \
	--api-name=nhs-notify-supplier \
	--proxy-name="$(PROXY_NAME)" \
	-s \
	--reruns 5 \
	--reruns-delay 5 \
	--only-rerun 'AssertionError: Unexpected 429' \
	--only-rerun 'AssertionError: Unexpected 504' \
	--only-rerun 'AssertionError: Unexpected 502' \
	--junitxml=test-report.xml


.internal-dev-test:
	@cd tests/e2e-tests && \
	$(TEST_CMD) \
	api \
	-m devtest

.integration-test:
	$(TEST_CMD) \
	tests/api \
	-m inttest


PROD_CMD := APIGEE_ACCESS_TOKEN="$(APIGEE_ACCESS_TOKEN)" \
	PYTHONPATH=. poetry run pytest --disable-warnings -vv \
	--color=yes \
	-n 4 \
	--api-name=nhs-notify-supplier \
	--proxy-name="$(PROXY_NAME)" \
	-s \
	--reruns 5 \
	--reruns-delay 5 \
	--only-rerun 'AssertionError: Unexpected 429' \
	--only-rerun 'AssertionError: Unexpected 504' \
	--only-rerun 'AssertionError: Unexpected 502' \
	--junitxml=test-report.xml

.prod-test:
	@cd tests/e2e-tests && \
	$(PROD_CMD) \
	tests/api \
	-m prodtest
