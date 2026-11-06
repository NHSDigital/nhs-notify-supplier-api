resource "aws_cloudwatch_log_group" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name              = "/aws/firehose/${local.csi}-eventpub-parquet"
  kms_key_id        = module.kms.key_arn
  retention_in_days = var.log_retention_in_days
}
