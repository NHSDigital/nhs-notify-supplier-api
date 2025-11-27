resource "aws_kinesis_stream" "letter_change_stream" {
  name             = "${local.csi}-letter-change-stream"
  shard_count      = 1
  retention_period = 24
}
