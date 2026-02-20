<!-- BEGIN_TF_DOCS -->
<!-- markdownlint-disable -->
<!-- vale off -->

## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.9.0 |
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_alarm_prefix"></a> [alarm\_prefix](#input\_alarm\_prefix) | n/a | `string` | n/a | yes |
| <a name="input_enable_error_log_metric"></a> [enable\_error\_log\_metric](#input\_enable\_error\_log\_metric) | n/a | `bool` | `true` | no |
| <a name="input_error_log_evaluation_periods"></a> [error\_log\_evaluation\_periods](#input\_error\_log\_evaluation\_periods) | n/a | `number` | `1` | no |
| <a name="input_error_log_metric_filter_pattern"></a> [error\_log\_metric\_filter\_pattern](#input\_error\_log\_metric\_filter\_pattern) | n/a | `string` | `"{ ($.level = \"50\" || $.level = \"error\") && $.environment = * }"` | no |
| <a name="input_error_log_metric_name_prefix"></a> [error\_log\_metric\_name\_prefix](#input\_error\_log\_metric\_name\_prefix) | n/a | `string` | `"LambdaErrorLogs-"` | no |
| <a name="input_error_log_metric_namespace"></a> [error\_log\_metric\_namespace](#input\_error\_log\_metric\_namespace) | n/a | `string` | `"Custom/LambdaErrorLogs"` | no |
| <a name="input_error_log_threshold"></a> [error\_log\_threshold](#input\_error\_log\_threshold) | n/a | `number` | `0` | no |
| <a name="input_errors_threshold"></a> [errors\_threshold](#input\_errors\_threshold) | n/a | `number` | `0` | no |
| <a name="input_evaluation_periods"></a> [evaluation\_periods](#input\_evaluation\_periods) | n/a | `number` | `1` | no |
| <a name="input_function_name"></a> [function\_name](#input\_function\_name) | n/a | `string` | n/a | yes |
| <a name="input_log_group_name"></a> [log\_group\_name](#input\_log\_group\_name) | n/a | `string` | `""` | no |
| <a name="input_period_seconds"></a> [period\_seconds](#input\_period\_seconds) | n/a | `number` | `300` | no |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(string)` | `{}` | no |
| <a name="input_throttles_threshold"></a> [throttles\_threshold](#input\_throttles\_threshold) | n/a | `number` | `0` | no |
## Modules

No modules.
## Outputs

No outputs.
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
