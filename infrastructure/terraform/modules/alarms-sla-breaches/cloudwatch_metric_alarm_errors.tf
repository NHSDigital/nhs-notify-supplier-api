resource "aws_cloudwatch_metric_alarm" "errors" {
  alarm_name        = "${var.alarm_prefix}-lambda-${var.function_name}-errors"
  alarm_description = "ERROR: Lambda errors"

  namespace   = "AWS/Lambda"
  metric_name = "Errors"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.evaluation_periods
  threshold           = var.errors_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { FunctionName = var.function_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
