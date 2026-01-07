resource "aws_lambda_event_source_mapping" "upsert_letter" {
  event_source_arn                   = module.amendments_queue.sqs_queue_arn
  function_name                      = module.upsert_letter.function_name
  batch_size                         = 10
  function_response_types = [
    "ReportBatchItemFailures"
  ]
}
