# Copilot Instructions for NHS Notify Supplier API

## Project Overview

- This repository provides the NHS Notify Supplier API for print suppliers to integrate with NHS Notify message queueing.
- Major components: OpenAPI specification (`specification/api/notify-supplier.yml`), SDKs (`sdk/`), server implementations (`server/`, `src/server/host`), and Lambda handlers (`lambdas/`).
- Data flows: API requests are modeled via OAS, processed by server/Lambda code, and may interact with AWS services (e.g., S3, database).

## Developer Workflows

- **Build SDKs and Docs:**
  - Run `make clean && make build` to generate Python/TypeScript SDKs and HTML docs from the OAS spec.
  - Serve docs locally with `make serve` [default](http://localhost:3050).
- **CI/CD:**
  - PRs trigger CI via GitHub Actions (`.github/workflows/cicd-1-pull-request.yaml`).
  - Merging to `main` creates a pre-release; deployments use `.github/workflows/cicd-3-deploy.yaml`.
- **Dev Environment:**
  - Use the provided devcontainer for setup and configuration. Avoid manual SDK changes; always rebuild.

## Project-Specific Conventions

- **SDKs:**
  - Never manually edit files in `sdk/`; always regenerate from the OAS spec.
  - SDK folder is excluded from git and built/released via CI.
- **Servers:**
  - Server code is generated at build time from OAS specs. See `server/` and `src/server/host` for custom logic.
- **Test Data:**
  - Use `scripts/test-data` to generate and upload test letters to S3. Example command:

    ```bash
    npm run cli -- create-letter --supplier-id ... --environment ... --awsAccountId ... --letter-id ... --group-id ... --specification-id ... --status PENDING
    ```

## Integration Points

- **External Services:**
  - AWS S3 and database for test data and letter storage.
  - OpenAPI Generator CLI for SDK/server generation.
- **Documentation:**
  - Latest [docs](https://nhsdigital.github.io/nhs-notify-supplier-api/)
  - Local docs: `make serve`

## Key Files & Directories

- `specification/api/notify-supplier.yml`: Main API spec
- `sdk/`: Generated SDKs (Python, TypeScript, CSharp)
- `server/`, `src/server/host`: Server implementations
- `lambdas/`: Lambda handlers
- `scripts/test-data/`: Test data generation scripts
- `docs/`: Documentation source

## Patterns & Examples

- Always regenerate SDKs/servers after spec changes.
- Use Makefile targets for all build/test workflows.
- Reference the README for up-to-date workflow and integration details.

---
For unclear or missing conventions, consult `/README.md` or ask maintainers for guidance.
