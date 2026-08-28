resource "aws_cloudwatch_metric_alarm" "write_capacity" {
  alarm_name        = "${var.alarm_prefix}-ddb-${var.table_name}-write-capacity"
  alarm_description = "RELIABILITY: DynamoDB consumed write capacity approaching limit"

  namespace   = "AWS/DynamoDB"
  metric_name = "ConsumedWriteCapacityUnits"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.evaluation_periods
  threshold           = var.write_capacity_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { TableName = var.table_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
