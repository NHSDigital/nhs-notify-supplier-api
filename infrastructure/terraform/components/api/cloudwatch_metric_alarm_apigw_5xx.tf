resource "aws_cloudwatch_metric_alarm" "apigw_five_xx" {
  alarm_name        = "${local.csi}-apigw-5xx"
  alarm_description = "RELIABILITY: API Gateway 5xx responses"

  namespace   = "AWS/ApiGateway"
  metric_name = "5XXError"
  statistic   = "Sum"
  period      = 60

  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.apigw_alarm_dimensions

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags
}
