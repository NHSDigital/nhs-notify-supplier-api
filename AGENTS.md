# AGENTS.md
<!-- vale off -->

## Scope

This file is for **AI agents** working within NHS Notify repositories.
Humans should read `README.md` and the docs for how we actually work day to day.
Keep anything language or tool-specific in nested `AGENTS.md` files (for example under `infrastructure/terraform` or `lambdas`).

## Repository Layout (high level)

At a glance, the main areas are:

- `pnpm-workspace.yaml` - Defines packages, dependency versions, and package installation options.
- `infrastructure/terraform/` – Terraform components, and shared modules for AWS accounts and environments.
- `lambdas/` – TypeScript lambda projects (each with their own `package.json`, Jest config, etc.). Root level package.json defines scripts. Tests for the lambda are stored in `lambdas/{name}/src/__test`.
- `src/` and `utils/` – Shared code and utilities (for example `utils/logger`).
- `docs/` – Documentation site, ADRs, RFCS, and other long‑form docs.
- `.github/workflows/` and `.github/actions/` – GitHub Actions workflows and composite actions.
- `scripts/` – Helper scripts and tooling used by humans and workflows.
- `tests/` – Cross‑cutting tests and harnesses for the repo.

Agents should look for a nested `AGENTS.md` in or near these areas before making non‑trivial changes.

## Root pnpm-workspace.yaml - role and usage

The root `pnpm-workspace.yaml` is the manifest for configuring the pnpm tool, and workspace packages.

- Packages: Declares the set of workspace packages (e.g. under `lambdas/`, `internal/`, `tests/`, `scripts/`). Agents should add a new package path here when introducing a new workspace package. `sandbox/` is deliberately not a workspace member: it is a standalone Docker image that still uses npm.
- Catalogs: Defines named version catalogs (`app`, `aws`, `lint`, `test`, `tools`) that centralise dependency version ranges. Workspace packages reference these with the `catalog:<name>` protocol (e.g. `"jest": "catalog:test"`) instead of hardcoding version ranges in each `package.json`.
- Overrides: Pins transitive dependencies (e.g. Jest/react-is) to avoid ecosystem conflicts. Agents must not remove overrides without verifying tests across all workspaces.
- `allowBuilds`: pnpm refuses to run dependency install scripts unless they are listed here. A new dependency with an install script will fail `pnpm install` until it is explicitly set to `true` or `false`.

Agent guidance for catalogs:

- When adding a dependency that belongs to an existing catalog category, add the version range to the appropriate catalog in `pnpm-workspace.yaml` and reference it as `"catalog:<name>"` in the consuming `package.json`.
- Do not hardcode version ranges in workspace `package.json` files for dependencies that already exist in a catalog — always use the `catalog:` protocol.
- When updating a dependency version, change it in the catalog entry only; all workspace packages referencing that catalog entry will pick up the new version automatically.
- If a dependency does not fit any existing catalog, create a new catalog with a suitable name and add the version range there.
- Internal workspace dependencies use the `workspace:*` protocol (e.g. `"@internal/helpers": "workspace:*"`). A semver range such as `^0.1.0` would make pnpm download the package from the registry instead of linking the local copy.
- Declare every package a workspace imports in that workspace's own `package.json`. pnpm does not hoist undeclared packages, so imports that previously worked by accident will fail.
- Exception to the catalog rule: `@nhsdigital/nhs-notify-event-schemas-letter-rendering` is a literal `2.0.2` in `lambdas/supplier-allocator` and `lambdas/upsert-letter`, because their tests read that version from `package.json`. A `catalog:` specifier would be read as the string `catalog:app`.
- Jest configs that transform `@nhsdigital/nhs-notify-event-schemas-supplier-config` use a `transformIgnorePatterns` entry that matches pnpm's `node_modules/.pnpm/@nhsdigital+...` store path as well as the plain path. Keep both alternatives if you change it.

## Root package.json – role and usage

The root `package.json` is the orchestration manifest for this repo. It does not ship application code; it wires up shared dev tooling and delegates to workspace-level projects.

- Scripts: Provides top-level commands that fan out across workspaces using `pnpm -r` (lint, typecheck, unit tests) and project-specific runners (e.g. `lambda-build`).
- Dev tool dependencies: Centralises Jest, TypeScript, ESLint configurations and plugins via pnpm catalogs to keep versions consistent across workspaces. Workspace projects should rely on catalog references unless a local override is strictly needed.
- SDK/server builds read the version from the `BUILDVER` environment variable (previously `npm run ... --buildver=`, which pnpm does not support).

Agent guidance:

- Before adding or removing a workspace, update the `packages` array in `pnpm-workspace.yaml` and ensure CI scripts still succeed with `pnpm run lint`, `pnpm run typecheck`, and `pnpm run test:unit` at the repo root. `eslint.config.mjs` also reads `pnpm-workspace.yaml` to find workspace directories.
- When adding repo-wide scripts, keep names consistent with existing patterns (e.g. `lint`, `lint:fix`, `typecheck`, `test:unit`, `lambda-build`) and prefer `pnpm -r run` fan-out.
- Pass script arguments directly (`pnpm run cli create-letter --id x`), not after `--`; pnpm forwards the `--` to the script.
- Do not publish from the root. If adding a new workspace intended for publication, mark that workspace package as `private: false` and keep the root as private.
- Validate changes by running the repo pre-commit hooks: `make githooks-run`.

Success criteria for changes affecting the root `package.json`:

- `pnpm run lint`, `pnpm run typecheck`, and `pnpm run test:unit` pass at the repo root.
- Workspace discovery is correct (new projects appear under `pnpm run typecheck`).
- No regression in lambda build tooling (`pnpm run lambda-build`).

## What Agents Can / Can’t Do

Agents **can**:

- Propose changes to code, tests, GitHub workflows, Terraform, and docs.
- Suggest new scripts, Make targets, or composite actions by copying existing patterns.
- Run tests to validate proposed solutions.

Agents **must not**:

- Create, push, or merge branches or PRs.
- Introduce new technologies, providers, or big architectural patterns without clearly calling out that an ADR is needed.
- Invent secrets or hard‑code real credentials anywhere.

## Working With This Repo

- All dependencies can be setup using the command `make config` from the repository root.
- **Don’t guess commands.** Derive them from what’s already here or ask for guidance form the human user:
  - Prefer `Makefile` targets, `scripts/`, `.github/workflows/`, and `.github/actions/`.
- For Terraform, follow `infrastructure/terraform/{components,modules}` and respect `versions.tf`.
- Keep diffs small and focused. Avoid mixing refactors with behaviour changes unless you explain why.

## Quality Expectations

When proposing a change, agents should:

- Keep code formatted and idiomatic (Terraform, TypeScript, Bash, YAML).
- Stick to existing patterns where available (for example `utils/logger`, composite actions under `.github/actions`).
- Use available information on best practices within the specific area of the codebase.
- **Always** run local pre-commit hooks from the repo root with:

  ```sh
    pre-commit run \
    --config scripts/config/pre-commit.yaml
  ```

  to catch formatting and basic lint issues. Domain specific checks will be defined in appropriate nested AGENTS.md files.

- Suggest at least one extra validation step (for example `pnpm test:unit` in a lambda, or triggering a specific workflow).
- Any required follow up activites which fall outside of the current task's scope should be clearly marked with a 'TODO: CCM-12345' comment. The human user should be prompted to create and provide a JIRA ticket ID to be added to the comment.

## Security & Safety

- All agent-generated changes **must** be reviewed and merged by a human.
- Provide a concise, clear summary of the proposed changes to make human review easier (what changed, why (refer directly to the guidance in relevant Agents.MD files when applicable), and how it was validated). It should be directly pastable into the PR description and make it clear that AI assistance was used.
- Never output real secrets or tokens. Use placeholders and rely on the GitHub/AWS secrets already wired into workflows.

## Escalation / Blockers

If you are blocked by an unavailable secret, unclear architectural constraint, missing upstream module, or failing tooling you cannot safely fix, stop and ask a single clear clarifying question rather than guessing.
