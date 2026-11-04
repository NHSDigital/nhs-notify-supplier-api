resource "aws_cloudwatch_log_stream" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name           = "extended_s3"
  log_group_name = aws_cloudwatch_log_group.eventpub_parquet_firehose[0].name
}
