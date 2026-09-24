# Name of this project's directory, derived from this Makefile's location
PROJECT_NAME := $(notdir $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST))))))
# Where current trial evidence is written; timestamped snapshots are created by the root workflow
EVIDENCE_DIR ?= ../../evidence/$(PROJECT_NAME)/current
# Registry index used when the Chainguard Libraries configuration is added
CHAINGUARD_INDEX_URL ?= https://libraries.cgr.dev/javascript/
# Organisation used to check Chainguard Libraries entitlements; set to enable that check
CHAINGUARD_ORG ?= nhs.net
# Host the npm credentials authenticate against (must match the index host)
CHAINGUARD_HOST ?= libraries.cgr.dev
# Repo-relative application source paths that must NOT change during the switch
APPLICATION_SOURCE_PATHS ?= lambdas internal server src sandbox pact-contracts scripts specification
# Paths whose changes are approved: registry configuration
APPROVED_CONFIGURATION_PATHS ?= .npmrc
# Paths whose changes are approved: dependency lockfiles (hash migration only)
APPROVED_LOCKFILES ?= package-lock.json
# Location of the shared, reusable JavaScript/TypeScript workflow scripts (repo-level scripts/javascript)
SCRIPTS ?= $(abspath $(dir $(lastword $(MAKEFILE_LIST)))../../scripts/javascript)

# Install dependencies from package.json/package-lock.json
env:
	npm ci

# Resolve and install the dependency graph used by the smoke check
build: env

# Run a fast project check without requiring external services
test: build
	npm run typecheck

# Serve the OpenAPI project locally
run: build
	npm run serve-oas

# Remove baseline evidence and all npm-managed state for a clean slate
clean:
	rm -rf "$(EVIDENCE_DIR)"
	rm -rf node_modules dist
	rm -f .npmrc
	git checkout HEAD -- package-lock.json 2>/dev/null || true
	npm cache clean --force

# Confirm node, npm and chainctl are installed, authenticated and entitled
check-prerequisites:
	"$(SCRIPTS)/check-prerequisites.sh"

# Record the pre-change baseline evidence required before switching registries
capture-baseline: build
	"$(SCRIPTS)/capture-baseline.sh"

# Configure npm authentication against the Chainguard Libraries registry
configure-netrc:
	"$(SCRIPTS)/configure-netrc.sh"

# Switch this project onto the Chainguard Libraries index and re-resolve the lockfile
use-chainguard:
	"$(SCRIPTS)/set-index.sh" chainguard

# Switch this project back to the default npm registry index and re-resolve the lockfile
use-default:
	"$(SCRIPTS)/set-index.sh" default

# Flip between the Chainguard and default index based on the current .npmrc
toggle-chainguard:
	"$(SCRIPTS)/set-index.sh" toggle

# Record the post-change evidence required after rebuilding against Chainguard Libraries
capture-post-change: build
	"$(SCRIPTS)/capture-post-change.sh"

# Analyse Chainguard coverage gaps for the current evidence directory
gap-analysis:
	"$(SCRIPTS)/gap-analysis.sh" "$(EVIDENCE_DIR)"

# Print the available targets
help:
	echo "Usage: make <target>   (see README.md for the full evidence workflow)"
	echo
	echo "  env                  install dependencies from package-lock.json"
	echo "  build                resolve and install the dependency graph"
	echo "  test                 run the fast type-check smoke test"
	echo "  run                  serve the OpenAPI project locally"
	echo "  clean                remove evidence and npm-managed state"
	echo "  check-prerequisites  confirm tooling and Chainguard access"
	echo "  capture-baseline     record pre-change baseline evidence"
	echo "  configure-netrc      configure npm auth for Chainguard Libraries"
	echo "  use-chainguard       switch onto the Chainguard Libraries index"
	echo "  use-default          switch back to the default npm index"
	echo "  toggle-chainguard    flip between default and Chainguard"
	echo "  capture-post-change  record post-change evidence and reports"
	echo "  gap-analysis         analyse Chainguard coverage gaps"

# ===============================================================================

.DEFAULT_GOAL := help
.EXPORT_ALL_VARIABLES:
.NOTPARALLEL:
.ONESHELL:
.PHONY: * # Please do not change this line! The alternative usage of it introduces unnecessary complexity and is considered an anti-pattern.
MAKEFLAGS := --no-print-directory
SHELL := /bin/bash
ifeq (true, $(shell [[ "${VERBOSE}" =~ ^(true|yes|y|on|1|TRUE|YES|Y|ON)$$ ]] && echo true))
	.SHELLFLAGS := -cex
else
	.SHELLFLAGS := -ce
endif

.SILENT: \
	build \
	capture-baseline \
	capture-post-change \
	gap-analysis \
	check-prerequisites \
	clean \
	configure-netrc \
	env \
	help \
	run \
	test \
	toggle-chainguard \
	use-chainguard \
	use-default