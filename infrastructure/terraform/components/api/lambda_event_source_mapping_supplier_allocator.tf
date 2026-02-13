resource "aws_lambda_event_source_mapping" "supplier_allocator" {
  event_source_arn                   = module.sqs_supplier_allocator.sqs_queue_arn
  function_name                      = module.supplier_allocator.function_name
  batch_size                         = 10
  maximum_batching_window_in_seconds = 5
  function_response_types = [
    "ReportBatchItemFailures"
  ]
}
