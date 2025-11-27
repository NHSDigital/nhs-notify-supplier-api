resource "aws_lambda_event_source_mapping" "letter_stream_forwarder_dynamodb" {
  event_source_arn                     = aws_dynamodb_table.letters.stream_arn
  function_name                        = module.letter_stream_forwarder.function_arn
  starting_position                    = "LATEST"
  batch_size                           = 10
  maximum_batching_window_in_seconds   = 1

  depends_on = [
    module.letter_stream_forwarder       # ensures stream forwarder exists
  ]
}

resource "aws_lambda_event_source_mapping" "letter_updates_transformer_kinesis" {
  event_source_arn                     = aws_kinesis_stream.letter_change_stream.arn
  function_name                        = module.letter_updates_transformer.function_arn
  starting_position                    = "LATEST"
  batch_size                           = 10
  maximum_batching_window_in_seconds   = 1

  depends_on = [
    module.letter_updates_transformer    # ensures updates transformer exists
  ]
}
