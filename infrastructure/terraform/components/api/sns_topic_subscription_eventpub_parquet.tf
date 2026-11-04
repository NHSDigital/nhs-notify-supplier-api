# Raw delivery so Firehose receives the bare event rather than the SNS envelope
resource "aws_sns_topic_subscription" "eventpub_parquet" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  topic_arn             = module.eventpub.sns_topic.arn
  protocol              = "firehose"
  subscription_role_arn = aws_iam_role.eventpub_parquet_sns[0].arn
  endpoint              = aws_kinesis_firehose_delivery_stream.eventpub_parquet[0].arn
  raw_message_delivery  = true
}
