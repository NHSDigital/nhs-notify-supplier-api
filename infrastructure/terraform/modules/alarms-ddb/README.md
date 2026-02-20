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
| <a name="input_evaluation_periods"></a> [evaluation\_periods](#input\_evaluation\_periods) | n/a | `number` | `1` | no |
| <a name="input_period_seconds"></a> [period\_seconds](#input\_period\_seconds) | n/a | `number` | `60` | no |
| <a name="input_read_throttle_threshold"></a> [read\_throttle\_threshold](#input\_read\_throttle\_threshold) | n/a | `number` | `0` | no |
| <a name="input_table_name"></a> [table\_name](#input\_table\_name) | n/a | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(string)` | `{}` | no |
| <a name="input_write_throttle_threshold"></a> [write\_throttle\_threshold](#input\_write\_throttle\_threshold) | n/a | `number` | `0` | no |
## Modules

No modules.
## Outputs

No outputs.
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
