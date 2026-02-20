resource "aws_cloudwatch_metric_alarm" "read_throttle" {
  alarm_name        = "${var.alarm_prefix}-ddb-${var.table_name}-read-throttle"
  alarm_description = "RELIABILITY: DynamoDB read throttling"

  namespace   = "AWS/DynamoDB"
  metric_name = "ReadThrottleEvents"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.evaluation_periods
  threshold           = var.read_throttle_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { TableName = var.table_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
