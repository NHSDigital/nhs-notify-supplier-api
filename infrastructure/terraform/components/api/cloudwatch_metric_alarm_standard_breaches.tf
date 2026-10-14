resource "aws_cloudwatch_metric_alarm" "errors" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  alarm_name        = "${local.csi}-standard-breaches"
  alarm_description = "RELIABILITY: Letters have breached the standard SLA"

  namespace   = module.populate_standard_breaches[0].function_name
  metric_name = "StandardBreachTotal"
  statistic   = "Maximum"
  period      = 300

  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "ignore"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags
}
