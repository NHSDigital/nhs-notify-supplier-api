locals {
  api_dimensions = {
    ApiName = var.api_name
    Stage   = var.stage_name
  }
}

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

resource "aws_cloudwatch_metric_alarm" "latency_anomaly" {
  alarm_name          = "${var.alarm_prefix}-apigw-latency-anomaly"
  alarm_description   = "RELIABILITY: API Gateway latency anomaly"
  comparison_operator = "GreaterThanUpperThreshold"
  evaluation_periods  = var.latency_evaluation_periods
  datapoints_to_alarm = var.latency_datapoints_to_alarm
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags

  metric_query {
    id = "m1"
    metric {
      metric_name = "Latency"
      namespace   = "AWS/ApiGateway"
      stat        = "Average"
      period      = var.latency_period_seconds
      dimensions  = local.api_dimensions
    }
    return_data = true
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.latency_anomaly_sensitivity})"
    label       = "Latency (expected)"
    return_data = false
  }
}
