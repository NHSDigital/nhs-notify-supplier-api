resource "aws_sns_topic_subscription" "eventsub_sqs_supplier_allocator" {
  topic_arn            = module.eventsub.sns_topic.arn
  protocol             = "sqs"
  endpoint             = module.sqs_supplier_allocator.sqs_queue_arn
  raw_message_delivery = true

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    type = [{ prefix = "uk.nhs.notify.letter-rendering.letter-request.prepared" }]
  })
}
