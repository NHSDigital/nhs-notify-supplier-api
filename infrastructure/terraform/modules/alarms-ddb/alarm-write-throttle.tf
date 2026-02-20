resource "aws_cloudwatch_metric_alarm" "write_throttle" {
  alarm_name        = "${var.alarm_prefix}-ddb-${var.table_name}-write-throttle"
  alarm_description = "RELIABILITY: DynamoDB write throttling"

  namespace   = "AWS/DynamoDB"
  metric_name = "WriteThrottleEvents"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.evaluation_periods
  threshold           = var.write_throttle_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { TableName = var.table_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
