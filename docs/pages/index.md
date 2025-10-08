---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
title: Home
nav_order: 1
description: Home
summary: Home
is_not_draft: false
last_modified_date: 2024-05-28
owner: NHS Notify
author: NHS Notify
permalink: /
---

<!-- markdownlint-disable MD025 -->

# NHS Notify Supplier API Home Page

<!-- markdownlint-enable MD025 -->

[![CI/CD Pull Request](https://github.com/NHSDigital/nhs-notify-repository-template/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/NHSDigital/nhs-notify-repository-template/actions/workflows/cicd-1-pull-request.yaml)

Welcome to the NHS Notify Supplier API repository.
This project provides a set of APIs and supporting documentation to allow communication suppliers to integrate with the NHS Notify service.

## Using this Documentation

> ### Who/what is this repository is for?
>
> - NHS Developers working on NHS Notify Supplier API
> - Suppliers who seek resources to support their integration with the NHS Notify Supplier API
> - Those who are interested in NHS Notify architecture and how it is actively developed
>
> ### Who/what is this repository **not** for?
>
> - Those who wish to send communications through NHS Notify
>
> ### What this repo contains
>
> - High level developer documentation for source code location, and build process.
> - The NHS Notify Supplier Open API Specification
> - The implementation of the API AWS backend and related Infrastructure as Code
> - Onboarding guidance documentation and supporting integration materials
>
> ### What this repo does **not** contain
>
> - Any configuration details of the Deployment phases or infrastructure of the Supplier API.
> - The generation of letters or their allocation to suppliers

## Table of Contents

- [NHS Notify Supplier API Home Page](#nhs-notify-supplier-api-home-page)
  - [Using this documentation](#using-this-documentation)
  - [Table of Contents](#table-of-contents)
  - [API Status](#api-status)
  - [OAS Specifications](#open-api-specification)
  - [Related Repos](#related-repos)
  - [API Consumers](#api-consumers)
  - [API Developers](#api-developers)
  - [Contributing](#contributing)
  - [Support](#support)
  - [Licence](#licence)

## API Status

This API is [in-development](https://digital.nhs.uk/developer/guides-and-documentation/reference-guide#statuses).

This API is being made available to support testing and integration, but may receive breaking changes based on feedback.

## Open API Specification

The API is defined through an Open API Specification `.yml` file.

Released versions of the specification can be found within [latest releases](https://github.com/NHSDigital/nhs-notify-supplier-api/releases)

The current specification file is found within [/specifications](/specification/api/notify-supplier-phase1.yml)

## Related Repos

- [nhs-notify](https://nhsdigital.github.io/nhs-notify)
- [nhs-notify-shared-modules](https://github.com/NHSDigital/nhs-notify-shared-modules)

## API Consumers

If you wish to integrated with the Supplier API refer to the [API Consumer](/consumers) pages and
[Getting Started as an API Consumer](/consumers/getting-started)

You may also find it helpful to refer to the [Specification](/specification)

## API Developers

For NHS Developers working on the Supplier API refer to the [API Developer](/developers) pages and
[Getting Started as an API Developer](/developers/getting-started.md)

### Contributing

For guidance on contributing to this documentation or this repository please refer to [Contributing](/contributing)

## Support

For questions or support, please raise an issue in this repository or contact the NHS Notify team.

## Licence

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is © Crown Copyright and available under the terms of the Open Government Licence v3.0.

### Version: {{ site.version }}
