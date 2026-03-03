resource "aws_cloudwatch_metric_alarm" "apigw_latency_threshold" {
  count = local.alarms_enabled ? 1 : 0

  alarm_name        = "${local.csi}-apigw-latency-threshold"
  alarm_description = "RELIABILITY: API Gateway latency above threshold"

  namespace   = "AWS/ApiGateway"
  metric_name = "Latency"
  statistic   = "Average"
  period      = 60

  evaluation_periods  = 5
  threshold           = 29000
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = local.apigw_alarm_dimensions

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags
}
