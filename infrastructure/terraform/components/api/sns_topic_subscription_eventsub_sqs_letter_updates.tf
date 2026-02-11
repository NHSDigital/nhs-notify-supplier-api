resource "aws_sns_topic_subscription" "eventsub_sqs_letter_updates" {
  topic_arn = module.eventsub.sns_topic.arn
  protocol  = "sqs"
  endpoint  = module.sqs_letter_updates.sqs_queue_arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    type = [{ prefix = "uk.nhs.notify.supplier-api.letter" }]
  })
}
