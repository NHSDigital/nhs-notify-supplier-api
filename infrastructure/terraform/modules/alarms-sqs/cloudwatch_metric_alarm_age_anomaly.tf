resource "aws_cloudwatch_metric_alarm" "age_anomaly" {
  alarm_name          = "${var.alarm_prefix}-sqs-${var.queue_name}-age-anomaly"
  alarm_description   = "RELIABILITY: SQS oldest message age is over 30 seconds"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.age_anomaly_evaluation_periods
  datapoints_to_alarm = var.age_anomaly_datapoints_to_alarm
  threshold           = var.age_threshold_seconds
  treat_missing_data  = "notBreaching"

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags

  metric_name = "ApproximateAgeOfOldestMessage"
  namespace   = "AWS/SQS"
  statistic   = "Maximum"
  period      = var.age_period_seconds
  dimensions  = local.queue_dimensions
}
