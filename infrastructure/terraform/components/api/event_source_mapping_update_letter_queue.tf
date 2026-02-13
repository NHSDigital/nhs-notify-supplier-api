resource "aws_lambda_event_source_mapping" "update_letter_queue_kinesis" {
  event_source_arn                   = aws_kinesis_stream.letter_change_stream.arn
  function_name                      = module.update_letter_queue.function_arn
  starting_position                  = "LATEST"
  batch_size                         = 10
  maximum_batching_window_in_seconds = 1

  depends_on = [
    module.update_letter_queue # ensures update letter queue lambda exists
  ]
}
