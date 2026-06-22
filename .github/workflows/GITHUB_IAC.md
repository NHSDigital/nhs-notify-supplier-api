# GitHub Repository Management

This workflow manages the GitHub repository settings for nhs-notify-supplier-api, including team permissions, branch protection rules, and other repository configuration.

## Overview

The workflow is triggered manually via GitHub's workflow dispatch interface and coordinates with the infrastructure code in [nhs-notify-internal](https://github.com/NHSDigital/nhs-notify-internal) to manage repository settings using Terraform.

## Workflow: `dispatch-github-iac.yaml`

### Inputs

- **terraformAction** (required): Choose between `plan` or `apply`
  
### Execution Model
- **overrides** (optional): Comma-separated list of pipeline overrides in `OVR_XXX=YYYY` format
  - Used for dynamic configuration of terraform variables
  - Example: `OVR_ENVIRONMENT=staging,OVR_REGION=eu-west-2`

### Triggering the Workflow

1. Go to [GitHub Actions](https://github.com/NHSDigital/nhs-notify-supplier-api/actions)
2. Select **"GitHub Repository Management"** workflow
3. Click **"Run workflow"**

### Process

1. **Validation**: Input validation is performed
2. **Plan**: Terraform plan is generated showing proposed changes
3. **Apply** (if selected): Changes are applied to the repository

### Infrastructure Code Location

Repository settings are defined in [nhs-notify-internal](https://github.com/NHSDigital/nhs-notify-internal):
- **Component**: `infrastructure/terraform/components/github/`
- **Module**: `module_nhs_notify_supplier_api.tf`
- **Data Sources**: `data_github_teams.tf`

### Managed Settings

The workflow manages:
- Repository visibility and features
- Team permissions and access levels
- Branch protection rules
- Merge strategy settings
- Repository topics and metadata

### Secrets Required

The workflow requires the following GitHub secret to be available in nhs-notify-supplier-api:
- `GH_MAINT_IAC_PAT`: GitHub Personal Access Token with repo management permissions

### Environment

The workflow targets the `nhs-notify-sharedinfra-dev` environment in AWS for authentication and terraform execution.

## Examples

### Example 1: Plan Repository Changes

```bash
# Via GitHub UI:
1. Go to Actions > GitHub Repository Management
2. Click "Run workflow"
3. Leave terraform action as "plan"
4. Leave overrides empty
5. Click "Run workflow"
```

### Example 2: Apply Repository Changes

```bash
# Via GitHub UI:
1. Go to Actions > GitHub Repository Management
2. Click "Run workflow"
3. Select terraform action: "apply"
4. Leave overrides empty
5. Click "Run workflow"
```

### Example 3: With Overrides

```bash
# Via GitHub UI:
1. Go to Actions > GitHub Repository Management
2. Click "Run workflow"
3. Select terraform action: "plan"
4. In overrides field, enter: OVR_ENVIRONMENT=dev,OVR_CUSTOM=value
5. Click "Run workflow"
```

## Related Documentation

- [nhs-notify-internal GitHub Component](../../../nhs-notify-internal/infrastructure/terraform/components/github/README.md)
- [Terraform GitHub Provider Documentation](https://registry.terraform.io/providers/integrations/github/latest/docs)

## Troubleshooting

### Workflow Fails with "Repository not found"

Ensure `nhs-notify-internal` repository is accessible and the `dispatch-deploy-github.yaml` workflow exists.

### Plan Shows No Changes

This is normal when repository settings are already in sync with infrastructure code.

### Apply Fails

Check:
1. Terraform state is not locked
2. Appropriate AWS IAM permissions exist
3. GitHub credentials (`GH_MAINT_IAC_PAT`) are valid and have sufficient permissions
