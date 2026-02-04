resource "aws_sns_topic_subscription" "eventsub_sqs_letter_updates" {
  topic_arn = module.eventsub.eventsub_topic.arn
  protocol  = "sqs"
  endpoint  = module.sqs_letter_updates.sqs_queue_arn
}
