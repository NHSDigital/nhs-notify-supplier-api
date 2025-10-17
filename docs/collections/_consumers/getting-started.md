---
title: API Consumers - Getting Started
nav_order: 1
has_children: false
has_toc: false
---

## Integration Guide

The primary resource for integrating and onboarding with the NHS Notify Supplier API can be found within the [Integration Guide](/consumers/integration)

## Specifications

The OAS defines the scope, behaviour, and interactions with the Supplier API.

Released versions of the specification can be found within [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases):

```text
api-oas-specification-[version].zip
```

### Building the Specification

If you have installed the local repository requirements or are utilising the devcontainer, you can build/serve the documentation locally:

```text
- make bundle-oas
- make serve-oas
```

## Documentation

This documentation is maintained within the [/docs](/docs) folder of the repository and published to [GitHub pages](https://nhsdigital.github.io/nhs-notify-supplier-api/) on PR merge

## SDK Assets

SDKs are generated for Python, TypeScript and C# using [@openapitools](https://github.com/OpenAPITools/openapi-generator-cli)

If packages are not available, then SDKs can be downloaded directly from [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases):

```text
- Python sdk-python-[Version].zip
- TypeScript sdk-ts-[Version].zip
- CSharp sdk-csharp-[Version].zip
```

An [NPM nhsnotifysupplier package](https://github.com/NHSDigital/nhs-notify-supplier-api/pkgs/npm/nhsnotifysupplier) is published on pre-releases and releases

## Sandbox

A sandbox environment is available to aid in discovery and development of your integration.

It will provide limited, fixed responses and does not require authentication to use.

There are two ways to access the sandbox:

- The public sandbox [https://sandbox.api.service.nhs.uk/notify-supplier](https://sandbox.api.service.nhs.uk/notify-supplier)
- Local Build

You can build the sandbox locally by installing the repository requirements (or using the devcontainer) and running:

```text
make generate-sandbox
```
