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
