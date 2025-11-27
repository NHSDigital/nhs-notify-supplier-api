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
| <a name="input_commit_id"></a> [commit\_id](#input\_commit\_id) | The commit to deploy. Must be in the tree for branch\_name | `string` | `"HEAD"` | no |
| <a name="input_component"></a> [component](#input\_component) | The variable encapsulating the name of this component | `string` | `"supapi"` | no |
| <a name="input_core_account_id"></a> [core\_account\_id](#input\_core\_account\_id) | AWS Account ID for Core | `string` | `"000000000000"` | no |
| <a name="input_core_environment"></a> [core\_environment](#input\_core\_environment) | Environment of Core | `string` | `"prod"` | no |
| <a name="input_default_tags"></a> [default\_tags](#input\_default\_tags) | A map of default tags to apply to all taggable resources within the component | `map(string)` | `{}` | no |
| <a name="input_disable_gateway_execute_endpoint"></a> [disable\_gateway\_execute\_endpoint](#input\_disable\_gateway\_execute\_endpoint) | Disable the execution endpoint for the API Gateway | `bool` | `true` | no |
| <a name="input_enable_backups"></a> [enable\_backups](#input\_enable\_backups) | Enable backups | `bool` | `false` | no |
| <a name="input_environment"></a> [environment](#input\_environment) | The name of the tfscaffold environment | `string` | n/a | yes |
| <a name="input_eventpub_control_plane_bus_arn"></a> [eventpub\_control\_plane\_bus\_arn](#input\_eventpub\_control\_plane\_bus\_arn) | ARN of the EventBridge control plane bus for eventpub | `string` | `""` | no |
| <a name="input_eventpub_data_plane_bus_arn"></a> [eventpub\_data\_plane\_bus\_arn](#input\_eventpub\_data\_plane\_bus\_arn) | ARN of the EventBridge data plane bus for eventpub | `string` | `""` | no |
| <a name="input_force_destroy"></a> [force\_destroy](#input\_force\_destroy) | Flag to force deletion of S3 buckets | `bool` | `false` | no |
| <a name="input_force_lambda_code_deploy"></a> [force\_lambda\_code\_deploy](#input\_force\_lambda\_code\_deploy) | If the lambda package in s3 has the same commit id tag as the terraform build branch, the lambda will not update automatically. Set to True if making changes to Lambda code from on the same commit for example during development | `bool` | `false` | no |
| <a name="input_group"></a> [group](#input\_group) | The group variables are being inherited from (often synonmous with account short-name) | `string` | n/a | yes |
| <a name="input_kms_deletion_window"></a> [kms\_deletion\_window](#input\_kms\_deletion\_window) | When a kms key is deleted, how long should it wait in the pending deletion state? | `string` | `"30"` | no |
| <a name="input_letter_table_ttl_hours"></a> [letter\_table\_ttl\_hours](#input\_letter\_table\_ttl\_hours) | Number of hours to set as TTL on letters table | `number` | `24` | no |
| <a name="input_letter_variant_map"></a> [letter\_variant\_map](#input\_letter\_variant\_map) | n/a | `map(object({ supplierId = string, specId = string }))` | <pre>{<br/>  "lv1": {<br/>    "specId": "spec1",<br/>    "supplierId": "supplier1"<br/>  },<br/>  "lv2": {<br/>    "specId": "spec2",<br/>    "supplierId": "supplier1"<br/>  },<br/>  "lv3": {<br/>    "specId": "spec3",<br/>    "supplierId": "supplier2"<br/>  }<br/>}</pre> | no |
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
| <a name="module_authorizer_lambda"></a> [authorizer\_lambda](#module\_authorizer\_lambda) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_domain_truststore"></a> [domain\_truststore](#module\_domain\_truststore) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-s3bucket.zip | n/a |
| <a name="module_eventpub"></a> [eventpub](#module\_eventpub) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-eventpub.zip | n/a |
| <a name="module_eventsub"></a> [eventsub](#module\_eventsub) | ../../modules/eventsub | n/a |
| <a name="module_get_letter"></a> [get\_letter](#module\_get\_letter) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_get_letter_data"></a> [get\_letter\_data](#module\_get\_letter\_data) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_get_letters"></a> [get\_letters](#module\_get\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_get_status"></a> [get\_status](#module\_get\_status) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_kms"></a> [kms](#module\_kms) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-kms.zip | n/a |
| <a name="module_letter_status_update"></a> [letter\_status\_update](#module\_letter\_status\_update) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_letter_status_updates_queue"></a> [letter\_status\_updates\_queue](#module\_letter\_status\_updates\_queue) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip | n/a |
| <a name="module_letter_updates_transformer"></a> [letter\_updates\_transformer](#module\_letter\_updates\_transformer) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
| <a name="module_logging_bucket"></a> [logging\_bucket](#module\_logging\_bucket) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-s3bucket.zip | n/a |
| <a name="module_mi_stream_forwarder"></a> [mi\_stream\_forwarder](#module\_mi\_stream\_forwarder) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip | n/a |
| <a name="module_mi_updates_transformer"></a> [mi\_updates\_transformer](#module\_mi\_updates\_transformer) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip | n/a |
| <a name="module_patch_letter"></a> [patch\_letter](#module\_patch\_letter) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip | n/a |
| <a name="module_post_letters"></a> [post\_letters](#module\_post\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip | n/a |
| <a name="module_post_mi"></a> [post\_mi](#module\_post\_mi) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip | n/a |
| <a name="module_s3bucket_test_letters"></a> [s3bucket\_test\_letters](#module\_s3bucket\_test\_letters) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-s3bucket.zip | n/a |
| <a name="module_sqs_letter_updates"></a> [sqs\_letter\_updates](#module\_sqs\_letter\_updates) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-sqs.zip | n/a |
| <a name="module_supplier_ssl"></a> [supplier\_ssl](#module\_supplier\_ssl) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-ssl.zip | n/a |
| <a name="module_upsert_letter"></a> [upsert\_letter](#module\_upsert\_letter) | https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip | n/a |
## Outputs

| Name | Description |
|------|-------------|
| <a name="output_api_urll"></a> [api\_urll](#output\_api\_urll) | n/a |
| <a name="output_deployment"></a> [deployment](#output\_deployment) | Deployment details used for post-deployment scripts |
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
