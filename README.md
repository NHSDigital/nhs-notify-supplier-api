# NHS Notify Supplier API

[![1. CI/CD pull request](https://github.com/NHSDigital/nhs-notify-supplier-api/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/NHSDigital/nhs-notify-supplier-api/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nhs-notify-supplier-api&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nhs-notify-supplier-api)

The NHS Notify Supplier API is intended primarily for print suppliers to integrate with the NHS Notify message request queueing system.

It models the concepts needed to configure production of letters and other printed materials to specific specifications, provide proofs of these materials, receive batch production requests, provide details of returned letters and correspondence, and to report on the status of these artifacts and associated management information such as volumes and assocated costs.

This repository documents the Supplier API specification and provides an SDK with examples and reference client implementations for interacting with it.

## OAS Specifications

- [Current Version](specification/api/notify-supplier.yml)
- [vNext](specification/api/notify-supplier-next.yml)

## Table of Contents

- [NHS Notify Supplier API](#nhs-notify-supplier-api)
  - [OAS Specifications](#oas-specifications)
  - [Table of Contents](#table-of-contents)
  - [Documentation](#documentation)
  - [Setup](#setup)
    - [Prerequisites and Configuration](#prerequisites-and-configuration)
  - [Build](#build)
  - [Licence](#licence)

## Documentation

- [Built](/)
- [Source](/docs/README.md)

## Setup

### Prerequisites and Configuration

- Utilised the devcontainer, for pre reqs and configuration.
- You should open in a devcontainer or a Github workspaces.
- By default it will run `make config` when the container is first setup
- The [SDK](sdk) folder is excluded from all pre reqs
- DO NOT make manual changes to the [SDK](sdk), instead [build](#build) it

## Build

To generate the SDK folder from changes to the [specification/api/notify-supplier.yml](specification/api/notify-supplier.yml) OAS specification:

```bash
make clean
make build
```

Currently these are include in Git. TODO: gitignore these and have the build pipeline generate artifacts that can be downloaded from GitHub.

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
