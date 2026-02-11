resource "aws_sns_topic_subscription" "eventsub_sqs_supplier_allocator" {
  # The supplier allocator queue will be introduced by another ticket. For now, route events directly to the letter updates queue.
  topic_arn = module.eventsub.sns_topic.arn
  protocol  = "sqs"
  endpoint  = module.sqs_letter_updates.sqs_queue_arn

  raw_message_delivery = true

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    type = [{ prefix = "uk.nhs.notify.letter-rendering.letter-request.prepared" }]
  })
}
