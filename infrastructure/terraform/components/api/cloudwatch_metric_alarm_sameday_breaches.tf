resource "aws_cloudwatch_metric_alarm" "sameday_breaches" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  alarm_name        = "${local.csi}-sameday-breaches"
  alarm_description = "RELIABILITY: Letters have breached the same-day SLA"

  namespace   = module.populate_sameday_breaches[0].function_name
  metric_name = "SamedayBreachTotal"
  statistic   = "Maximum"
  period      = 300

  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  # The total is only published hourly; hold the last state between runs
  treat_missing_data = "ignore"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags
}
