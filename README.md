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
  - [API Consumers - Getting Started](#api-consumers---getting-started)
    - [OAS Specification](#oas-specification)
    - [Packages](#packages)
    - [Documentation](#documentation)
    - [SDK Assets](#sdk-assets)
    - [Examples](#examples)
  - [API Developers](#api-developers)
    - [Documentation](#documentation-1)
    - [pre built servers](#pre-built-servers)
    - [Setup](#setup)
      - [Prerequisites and Configuration](#prerequisites-and-configuration)
        - [SDKs](#sdks)
        - [Servers](#servers)
        - [Libs](#libs)
    - [Build](#build)
    - [GitHub Actions CI/CD](#github-actions-cicd)
      - [CI (Automatic)](#ci-automatic)
      - [CD (Manual)](#cd-manual)
  - [Licence](#licence)

## API Consumers - Getting Started

### OAS Specification

- Download the OAS Specification File from the [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)
  - OAS JSON files `api-oas-specification-[Version].zip`

### Packages

- [NPM package](https://github.com/NHSDigital/nhs-notify-supplier-api/pkgs/npm/nhsnotifysupplier)

### Documentation

- View the [latest SDK documentation](https://nhsdigital.github.io/nhs-notify-supplier-api/)
- Download local versions of the API docs from the [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)
  - HTML `sdk-html-[Version].zip`
  - Swagger `sdk-swagger-[Version].zip`

### SDK Assets

If packages are unavailable the latest SDKs can be downloaded directly from:

- Download SDKs from the [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)
  - Python `sdk-python-[Version].zip`
  - TypeScript `sdk-ts-[Version].zip`
  - CSharp `sdk-csharp-[Version].zip`

### Examples

TODO: Links to example clients.

## API Developers

New developer of the NHS Notify Supplier API
should understand the below.

### Documentation

- [Built](/)
- [Source](/docs/README.md)

### pre built servers

- "Working" C# server [/src/server/host](/src/server/host) `docker run -p 8080:8080 ghcr.io/nhsdigital/libshostdocker:latest`
  - View at [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)
- Docker OAS example Server (csharp) `docker run -p 3000:3000 ghcr.io/nhsdigital/nhsnotifysupplierserver:latest`
- CSharp `server-csharp-[Version].zip`

### Setup

#### Prerequisites and Configuration

- Utilised the devcontainer, for pre reqs and configuration.
- You should open in a devcontainer or a Github workspaces.
- By default it will run `make config` when the container is first setup

##### SDKs

- The [SDK](sdk) folder is excluded from all pre reqs
- DO NOT make manual changes to the [SDK](sdk), instead [build](#build) it
- The SDK folder is excluded from git commits,
  and will be built as part of the CI/CD pipeline and released as a GitHub
  release.

##### Servers

- Servers folder is being built at build time from OAS specs.
- TODO: Build actual servers

##### Libs

- [/src/server](/src/server) has various separate libaries that are used by:
  - [/src/server/host](/src/server/host) custom loads libs for different parts of the server

### Build

To generate the SDK folder from changes to the [specification/api/notify-supplier.yml](specification/api/notify-supplier.yml) OAS specification:

```bash
make clean
make build
```

This will generate:

- Python SDK
- TypeScript SDK
- HTML Docs

To view HTML docs:

```bash
make serve
```

by default they will be available at [http://localhost:3050](http://localhost:3050)

These are generated using [https://hub.docker.com/r/openapitools/openapi-generator-cli](https://hub.docker.com/r/openapitools/openapi-generator-cli)

### GitHub Actions CI/CD

#### CI (Automatic)

PRs will run the [CI workflow](https://github.com/NHSDigital/nhs-notify-supplier-api/actions/workflows/cicd-1-pull-request.yaml)
for testing.

PRs that are merged to main will run the same [CI workflow](https://github.com/NHSDigital/nhs-notify-supplier-api/actions/workflows/cicd-1-pull-request.yaml)
will generate a
[pre-release](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)
based on the date and the commit hash.

#### CD (Manual)

Deployments can be made of any [release](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)
(including the GitHub pages) by running the CD pipeline
[cicd-3-deploy.yaml](https://github.com/NHSDigital/nhs-notify-supplier-api/actions/workflows/cicd-3-deploy.yaml)

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
