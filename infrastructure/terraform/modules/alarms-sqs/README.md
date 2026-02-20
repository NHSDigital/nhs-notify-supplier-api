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
| <a name="input_age_anomaly_datapoints_to_alarm"></a> [age\_anomaly\_datapoints\_to\_alarm](#input\_age\_anomaly\_datapoints\_to\_alarm) | n/a | `number` | `3` | no |
| <a name="input_age_anomaly_evaluation_periods"></a> [age\_anomaly\_evaluation\_periods](#input\_age\_anomaly\_evaluation\_periods) | n/a | `number` | `5` | no |
| <a name="input_age_anomaly_sensitivity"></a> [age\_anomaly\_sensitivity](#input\_age\_anomaly\_sensitivity) | n/a | `number` | `3` | no |
| <a name="input_age_period_seconds"></a> [age\_period\_seconds](#input\_age\_period\_seconds) | n/a | `number` | `900` | no |
| <a name="input_alarm_prefix"></a> [alarm\_prefix](#input\_alarm\_prefix) | n/a | `string` | n/a | yes |
| <a name="input_dlq_queue_name"></a> [dlq\_queue\_name](#input\_dlq\_queue\_name) | n/a | `string` | `null` | no |
| <a name="input_dlq_visible_threshold"></a> [dlq\_visible\_threshold](#input\_dlq\_visible\_threshold) | n/a | `number` | `0` | no |
| <a name="input_queue_name"></a> [queue\_name](#input\_queue\_name) | n/a | `string` | n/a | yes |
| <a name="input_tags"></a> [tags](#input\_tags) | n/a | `map(string)` | `{}` | no |
## Modules

No modules.
## Outputs

No outputs.
<!-- vale on -->
<!-- markdownlint-enable -->
<!-- END_TF_DOCS -->
