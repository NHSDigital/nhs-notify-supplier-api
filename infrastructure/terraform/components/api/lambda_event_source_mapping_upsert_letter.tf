resource "aws_lambda_event_source_mapping" "upsert_letter" {
  event_source_arn                   = module.sqs_letter_updates.sqs_queue_arn
  function_name                      = module.upsert_letter.function_name
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  function_response_types = [
    "ReportBatchItemFailures"
  ]
}
