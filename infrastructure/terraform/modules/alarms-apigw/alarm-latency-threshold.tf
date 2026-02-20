resource "aws_cloudwatch_metric_alarm" "latency_threshold" {
  alarm_name        = "${var.alarm_prefix}-apigw-latency-threshold"
  alarm_description = "RELIABILITY: API Gateway latency above threshold"

  namespace   = "AWS/ApiGateway"
  metric_name = "Latency"
  statistic   = "Average"
  period      = var.latency_period_seconds

  evaluation_periods  = var.latency_evaluation_periods
  threshold           = var.latency_threshold_ms
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.api_dimensions

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
