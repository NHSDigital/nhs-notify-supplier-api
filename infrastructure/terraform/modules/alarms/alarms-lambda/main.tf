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

resource "aws_cloudwatch_log_metric_filter" "error_logs" {
  count          = var.enable_error_log_metric ? 1 : 0
  name           = "${var.alarm_prefix}-lambda-${var.function_name}-error-logs"
  log_group_name = var.log_group_name
  pattern        = var.error_log_metric_filter_pattern

  metric_transformation {
    name      = "${var.error_log_metric_name_prefix}${var.function_name}"
    namespace = var.error_log_metric_namespace
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_logs" {
  count               = var.enable_error_log_metric ? 1 : 0
  alarm_name          = "${var.alarm_prefix}-lambda-${var.function_name}-error-logs"
  alarm_description   = "ERROR: Lambda error logs detected"

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
