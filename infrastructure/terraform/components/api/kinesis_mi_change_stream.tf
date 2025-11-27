resource "aws_kinesis_stream" "mi_change_stream" {
  name             = "mi-change-stream"
  shard_count      = 1
  retention_period = 24
}
