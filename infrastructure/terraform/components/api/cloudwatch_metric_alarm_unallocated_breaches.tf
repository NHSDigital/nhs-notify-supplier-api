resource "aws_cloudwatch_metric_alarm" "unallocated_breaches" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  alarm_name        = "${local.csi}-unallocated-breaches"
  alarm_description = "RELIABILITY: Letters have breached the unallocated SLA"

  namespace   = module.populate_unallocated_breaches[0].function_name
  metric_name = "UnallocatedBreachTotal"
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
