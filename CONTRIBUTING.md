# Contributing to NHS Notify Supplier API

## Feature Branches

All changes to the repo must be created on a feature branch and submitted for peer review as a Pull Request (PR) via GitHub.

Feature branch names should follow the format below:

```text
feature/${jira-ticket-number}_${precis-of-branch-purpose}
```

e.g.

```text
feature/CCM-11207_documentation
```

## Main Branch

You are not permitted to push directly to the remote `main` branch in GitHub.

Changes to `main` when require approval(s) recorded on your PR.
Required approvers are controlled by the CODEOWNERS file but in summary:

- Infrastructure changes should be reviewed by DevOps team members
- Workflow/action changes should be reviewed by Maintainers of the repo
- All other changes should be review by NHS API Development team members

Merges should only take place:

- They are intended for the next release cycle
- All CI workflows have completed successfully

## Coding Standards

Your PR must follow all agreed coding standards for the project. Terraform and CI/CD standards are listed in sections below.

### GitHooks

GitHooks are available within this repo to help maintain standards and protect against e.g. secrets disclosure

GitHooks **must** be configured and run on commits before pushing to remote. Refer to the developer documentation for more information if required.

## Testing Your Branch

You can test your branch in a dynamic environment prior to merging to `main`. These are created as part of the `cicd-1-pull-request.yaml` workflow, triggered when a PR is created or updated.
