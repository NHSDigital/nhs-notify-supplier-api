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
