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
| <a name="input_api_name"></a> [api\_name](#input\_api\_name) | n/a | `string` | n/a | yes |
| <a name="input_error_5xx_evaluation_periods"></a> [error\_5xx\_evaluation\_periods](#input\_error\_5xx\_evaluation\_periods) | n/a | `number` | `1` | no |
| <a name="input_error_5xx_period_seconds"></a> [error\_5xx\_period\_seconds](#input\_error\_5xx\_period\_seconds) | n/a | `number` | `60` | no |
| <a name="input_error_5xx_threshold"></a> [error\_5xx\_threshold](#input\_error\_5xx\_threshold) | n/a | `number` | `0` | no |
| <a name="input_latency_anomaly_sensitivity"></a> [latency\_anomaly\_sensitivity](#input\_latency\_anomaly\_sensitivity) | n/a | `number` | `2` | no |
| <a name="input_latency_datapoints_to_alarm"></a> [latency\_datapoints\_to\_alarm](#input\_latency\_datapoints\_to\_alarm) | n/a | `number` | `3` | no |
| <a name="input_latency_evaluation_periods"></a> [latency\_evaluation\_periods](#input\_latency\_evaluation\_periods) | n/a | `number` | `5` | no |
| <a name="input_latency_period_seconds"></a> [latency\_period\_seconds](#input\_latency\_period\_seconds) | n/a | `number` | `60` | no |
| <a name="input_latency_threshold_ms"></a> [latency\_threshold\_ms](#input\_latency\_threshold\_ms) | n/a | `number` | `29000` | no |
| <a name="input_stage_name"></a> [stage\_name](#input\_stage\_name) | n/a | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(string)` | `{}` | no |
## Modules

No modules.
## Outputs

No outputs.
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
