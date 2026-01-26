resource "aws_lambda_event_source_mapping" "letter_status_update" {
  event_source_arn                   = module.letter_status_updates_queue.sqs_queue_arn
  function_name                      = module.letter_status_update.function_name
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  function_response_types = [
    "ReportBatchItemFailures"
  ]
}
