locals {
  queue_dimensions = { QueueName = var.queue_name }
}

resource "aws_cloudwatch_metric_alarm" "age_anomaly" {
  alarm_name          = "${var.alarm_prefix}-sqs-${var.queue_name}-age-anomaly"
  alarm_description   = "RELIABILITY: SQS oldest message age anomaly"
  comparison_operator = "GreaterThanUpperThreshold"
  evaluation_periods  = var.age_anomaly_evaluation_periods
  datapoints_to_alarm = var.age_anomaly_datapoints_to_alarm
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
      metric_name = "ApproximateAgeOfOldestMessage"
      namespace   = "AWS/SQS"
      stat        = "Maximum"
      period      = var.age_period_seconds
      dimensions  = local.queue_dimensions
    }
    return_data = true
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.age_anomaly_sensitivity})"
    label       = "AgeOfOldestMessage (expected)"
    return_data = true
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_depth" {
  count             = var.dlq_queue_name == null ? 0 : 1
  alarm_name        = "${var.alarm_prefix}-sqs-${var.dlq_queue_name}-dlq-depth"
  alarm_description = "RELIABILITY: SQS DLQ has messages"

  namespace   = "AWS/SQS"
  metric_name = "ApproximateNumberOfMessagesVisible"
  statistic   = "Sum"
  period      = 60

  evaluation_periods  = 1
  threshold           = var.dlq_visible_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = { QueueName = var.dlq_queue_name }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = var.tags
}
