resource "aws_sns_topic_subscription" "amendments_queue" {
  topic_arn            = module.eventsub.sns_topic_supplier.arn
  protocol             = "sqs"
  endpoint             = module.amendments_queue.sqs_queue_arn
  raw_message_delivery = false
}
