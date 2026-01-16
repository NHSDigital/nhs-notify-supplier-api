resource "aws_lambda_event_source_mapping" "supplier_events_forwarder" {
  event_source_arn                   = module.supplier_events_queue.sqs_queue_arn
  function_name                      = module.supplier_events_forwarder_lambda.function_arn
  batch_size                         = 10
  function_response_types = [
    "ReportBatchItemFailures"
  ]
  }
