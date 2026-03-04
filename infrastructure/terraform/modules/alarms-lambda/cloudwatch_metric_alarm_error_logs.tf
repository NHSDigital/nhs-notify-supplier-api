resource "aws_cloudwatch_metric_alarm" "error_logs" {
  count             = var.enable_error_log_metric ? 1 : 0
  alarm_name        = "${var.alarm_prefix}-lambda-${var.function_name}-error-logs"
  alarm_description = "ERROR: Lambda error logs detected"

  namespace   = var.error_log_metric_namespace
  metric_name = "${var.error_log_metric_name_prefix}${var.function_name}"
  statistic   = "Sum"
  period      = var.period_seconds

  evaluation_periods  = var.error_log_evaluation_periods
  threshold           = var.error_log_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
