resource "aws_sns_topic_subscription" "supplier_events_queue" {
  topic_arn            = module.eventsub.sns_topic_clone.arn
  protocol             = "sqs"
  endpoint             = module.supplier_events_queue.sqs_queue_arn
  raw_message_delivery = false
}
