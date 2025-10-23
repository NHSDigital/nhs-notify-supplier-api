# This file is for you! Edit it to implement your own hooks (make targets) into
# the project as automated steps to be executed on locally and in the CD pipeline.

include scripts/init.mk

# ==============================================================================

# Example CI/CD targets are: dependencies, build, publish, deploy, clean, etc.

dependencies: # Install dependencies needed to build and test the project @Pipeline
	# TODO: Implement installation of your project dependencies

build: # Build the project artefact @Pipeline
	(cd server && make build)
	(cd sdk && make build)
	(cd docs && make build)
	(cd src/server && make build)
publish: # Publish the project artefact @Pipeline
	# TODO: Implement the artefact publishing step

deploy: # Deploy the project artefact to the target environment @Pipeline
	# TODO: Implement the artefact deployment step

clean:: # Clean-up project resources (main) @Operations
	rm -f .version
	(cd sdk && make clean)
	(cd server && make clean)
	(cd src/server && make clean)

guard-%:
	@ if [ "${${*}}" = "" ]; then \
		echo "Variable $* not set"; \
		echo "Usage: make <target> APIM_ENV=<env>"
		exit 1; \
	fi
serve:
	npm run serve

lint-oas:
	npm run lint-oas

publish-oas:
	$(MAKE) copy-examples
	npm run publish-oas

set-target: guard-APIM_ENV
	@ TARGET=target-$$APIM_ENV.yml \
	envsubst '$${TARGET}' \
	< specification/api/components/x-nhsd-apim/target-template.yml > specification/api/components/x-nhsd-apim/target.yml

set-access: guard-APIM_ENV
	@ ACCESS=access-$$APIM_ENV.yml \
	envsubst '$${ACCESS}' \
	< specification/api/components/x-nhsd-apim/access-template.yml > specification/api/components/x-nhsd-apim/access.yml

set-security: guard-APIM_ENV
	@ SECURITY=security-$$APIM_ENV.yml \
	envsubst '$${SECURITY}' \
	< specification/api/components/security/security-template.yml > specification/api/components/security/security.yml

construct-spec: guard-APIM_ENV
	$(MAKE) set-target APIM_ENV=$$APIM_ENV
	$(MAKE) set-access APIM_ENV=$$APIM_ENV
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
	cp -r ./sandbox/data/examples/. ./specification/api/components/examples

config:: _install-dependencies version # Configure development environment (main) @Configuration
	npm install
	(cd docs && make install && cd ..)


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
