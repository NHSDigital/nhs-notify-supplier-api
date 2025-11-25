resource "aws_kinesis_stream" "letter_change_stream" {
  name             = "letter-change-stream"
  shard_count      = 1
  retention_period = 24
}
