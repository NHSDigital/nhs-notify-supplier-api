<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

No requirements.
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_aws_account_id"></a> [aws\_account\_id](#input\_aws\_account\_id) | The AWS Account ID (numeric) | `string` | n/a | yes |
| <a name="input_ca_pem_filename"></a> [ca\_pem\_filename](#input\_ca\_pem\_filename) | Filename for the CA truststore file within the s3 bucket | `string` | `null` | no |
| <a name="input_component"></a> [component](#input\_component) | The variable encapsulating the name of this component | `string` | `"supapi"` | no |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_enable_backups"></a> [enable\_backups](#input\_enable\_backups) | Enable backups | `bool` | `false` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_force_destroy"></a> [force\_destroy](#input\_force\_destroy) | Flag to force deletion of S3 buckets | `bool` | `false` | no |
| <a name="input_force_lambda_code_deploy"></a> [force\_lambda\_code\_deploy](#input\_force\_lambda\_code\_deploy) | If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development | `bool` | `false` | no |
| <a name="input_group"></a> [group](#input\_group) | The group variables are being inherited from (often synonmous with account short-name) | `string` | n/a | yes |
| <a name="input_kms_deletion_window"></a> [kms\_deletion\_window](#input\_kms\_deletion\_window) | When a kms key is deleted, how long should it wait in the pending deletion state? | `string` | `"30"` | no |
| <a name="input_letter_table_ttl_hours"></a> [letter\_table\_ttl\_hours](#input\_letter\_table\_ttl\_hours) | Number of hours to set as TTL on letters table | `number` | `24` | no |
| <a name="input_log_level"></a> [log\_level](#input\_log\_level) | The log level to be used in lambda functions within the component. Any log with a lower severity than the configured value will not be logged: https://docs.python.org/3/library/logging.html#levels | `string` | `"INFO"` | no |
| <a name="input_log_retention_in_days"></a> [log\_retention\_in\_days](#input\_log\_retention\_in\_days) | The retention period in days for the Cloudwatch Logs events to be retained, default of 0 is indefinite | `number` | `0` | no |
| <a name="input_manually_configure_mtls_truststore"></a> [manually\_configure\_mtls\_truststore](#input\_manually\_configure\_mtls\_truststore) | Manually manage the truststore used for API Gateway mTLS (e.g. for prod environment) | `bool` | `false` | no |
| <a name="input_max_get_limit"></a> [max\_get\_limit](#input\_max\_get\_limit) | Default limit to apply to GET requests that support pagination | `number` | `2500` | no |
| <a name="input_parent_acct_environment"></a> [parent\_acct\_environment](#input\_parent\_acct\_environment) | Name of the environment responsible for the acct resources used, affects things like DNS zone. Useful for named dev environments | `string` | `"main"` | no |
| <a name="input_project"></a> [project](#input\_project) | The name of the tfscaffold project | `string` | n/a | yes |
| <a name="input_region"></a> [region](#input\_region) | The AWS Region | `string` | n/a | yes |
| <a name="input_shared_infra_account_id"></a> [shared\_infra\_account\_id](#input\_shared\_infra\_account\_id) | The AWS Account ID of the shared infrastructure account | `string` | `"000000000000"` | no |
## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_authorizer_lambda"></a> [authorizer\_lambda](#module\_authorizer\_lambda) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_domain_truststore"></a> [domain\_truststore](#module\_domain\_truststore) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-s3bucket.zip | n/a |
| <a name="module_get_letter"></a> [get\_letter](#module\_get\_letter) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_get_letter_data"></a> [get\_letter\_data](#module\_get\_letter\_data) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_get_letters"></a> [get\_letters](#module\_get\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_get_status"></a> [get\_status](#module\_get\_status) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_kms"></a> [kms](#module\_kms) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-kms.zip | n/a |
| <a name="module_letter_status_update"></a> [letter\_status\_update](#module\_letter\_status\_update) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_letter_status_updates_queue"></a> [letter\_status\_updates\_queue](#module\_letter\_status\_updates\_queue) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip | n/a |
| <a name="module_logging_bucket"></a> [logging\_bucket](#module\_logging\_bucket) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-s3bucket.zip | n/a |
| <a name="module_patch_letter"></a> [patch\_letter](#module\_patch\_letter) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_post_letters"></a> [post\_letters](#module\_post\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_post_mi"></a> [post\_mi](#module\_post\_mi) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_s3bucket_test_letters"></a> [s3bucket\_test\_letters](#module\_s3bucket\_test\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-s3bucket.zip | n/a |
| <a name="module_supplier_ssl"></a> [supplier\_ssl](#module\_supplier\_ssl) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-ssl.zip | n/a |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_api_urll"></a> [api\_urll](#output\_api\_urll) | n/a |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
