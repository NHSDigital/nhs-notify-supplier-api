resource "aws_sns_topic_subscription" "eventsub_sqs_letter_updates_clone" {
  topic_arn = module.eventsub.sns_topic_clone.arn
  protocol  = "sqs"
  endpoint  = module.sqs_letter_updates.sqs_queue_arn
}
