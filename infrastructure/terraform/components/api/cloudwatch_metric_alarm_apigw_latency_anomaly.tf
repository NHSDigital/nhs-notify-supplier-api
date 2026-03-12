resource "aws_cloudwatch_metric_alarm" "apigw_latency_anomaly" {
  count = local.alarms_enabled ? 1 : 0

  alarm_name          = "${local.csi}-apigw-latency-anomaly"
  alarm_description   = "RELIABILITY: API Gateway latency anomaly"
  comparison_operator = "GreaterThanUpperThreshold"
  evaluation_periods  = 5
  datapoints_to_alarm = 3
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags

  metric_query {
    id = "m1"
    metric {
      metric_name = "Latency"
      namespace   = "AWS/ApiGateway"
      stat        = "Average"
      period      = 60
      dimensions  = local.apigw_alarm_dimensions
    }
    return_data = true
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, 2)"
    label       = "Latency (expected)"
    return_data = true
  }
}
