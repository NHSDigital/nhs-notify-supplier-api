resource "aws_kinesis_stream" "mi_change_stream" {
  name             = "${local.csi}-mi-change-stream"
  shard_count      = 1
  retention_period = 24
}

resource "aws_dynamodb_kinesis_streaming_destination" "mi_streaming_destination" {
  stream_arn                               = aws_kinesis_stream.mi_change_stream.arn
  table_name                               = aws_dynamodb_table.mi.name
  approximate_creation_date_time_precision = "MILLISECOND"
}
