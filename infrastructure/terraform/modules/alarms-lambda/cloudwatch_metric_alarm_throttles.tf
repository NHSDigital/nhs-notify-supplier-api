resource "aws_cloudwatch_metric_alarm" "throttles" {
  alarm_name        = "${var.alarm_prefix}-lambda-${var.function_name}-throttles"
  alarm_description = "RELIABILITY: Lambda throttles"

  namespace   = "AWS/Lambda"
  metric_name = "Throttles"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.evaluation_periods
  threshold           = var.throttles_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { FunctionName = var.function_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
