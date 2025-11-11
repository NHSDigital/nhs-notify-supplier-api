resource "aws_cloudwatch_metric_alarm" "alm-apim-client-certificate-near-expiry" {
  alarm_name        = "${local.csi}-alm-apim-client-certificate-near-expiry"
  alarm_description = "RELIABILITY: An APIM client certificate is due to expire soon"

  metric_name = "apim-client-certificate-near-expiry"
  namespace   = "comms-apim-authorizer"

  dimensions = {
    Environment = local.parameter_bundle.environment
  }

  period              = 60 * 60 * 4 //4 hours
  comparison_operator = "GreaterThanThreshold"
  threshold           = "0"
  evaluation_periods  = "1"
  statistic           = "Sum"
  treat_missing_data  = "notBreaching"

  actions_enabled = "false"
  alarm_actions   = []
  ok_actions      = []
}
