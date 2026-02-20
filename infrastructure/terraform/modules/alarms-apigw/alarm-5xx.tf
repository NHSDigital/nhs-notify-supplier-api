resource "aws_cloudwatch_metric_alarm" "five_xx" {
  alarm_name        = "${var.alarm_prefix}-apigw-5xx"
  alarm_description = "RELIABILITY: API Gateway 5xx responses"

  namespace   = "AWS/ApiGateway"
  metric_name = "5XXError"
  statistic   = "Sum"
  period      = var.error_5xx_period_seconds

  evaluation_periods  = var.error_5xx_evaluation_periods
  threshold           = var.error_5xx_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.api_dimensions

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
