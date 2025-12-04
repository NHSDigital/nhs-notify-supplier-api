resource "aws_kinesis_stream" "letter_change_stream" {
  name             = "${local.csi}-letter-change-stream"
  shard_count      = 1
  retention_period = 24
}

resource "aws_dynamodb_kinesis_streaming_destination" "letter_streaming_destination" {
  stream_arn                               = aws_kinesis_stream.letter_change_stream.arn
  table_name                               = aws_dynamodb_table.letters.name
  approximate_creation_date_time_precision = "MILLISECOND"
}
