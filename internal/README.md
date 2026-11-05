# Internal Packages

## Purpose

This directory contains shared workspace packages that export code used by other packages in the repository (especially Lambda workspaces).

These packages provide common schemas, datastore repositories, event builders, and helper utilities so implementation code can reuse a single source of truth.

## What is here

- `datastore/`: shared DynamoDB repositories, domain types, and related errors.
- `events/`: shared event schemas and TypeScript types.
- `event-builders/`: shared mappers/builders for CloudEvent payloads.
- `helpers/`: shared logging, metrics, environment, and utility helpers.

## Usage

Import from these packages in other workspaces rather than duplicating logic locally.
