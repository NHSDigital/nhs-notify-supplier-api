resource "aws_lambda_event_source_mapping" "mi_updates_transformer_kinesis" {
  event_source_arn                     = aws_kinesis_stream.mi_change_stream.arn
  function_name                        = module.mi_updates_transformer.function_arn
  starting_position                    = "LATEST"
  batch_size                           = 10
  maximum_batching_window_in_seconds   = 1

  depends_on = [
    module.mi_updates_transformer    # ensures updates transformer exists
  ]
}
