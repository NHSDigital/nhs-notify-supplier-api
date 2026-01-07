resource "aws_lambda_event_source_mapping" "status_updates_sqs_to_status_update_handler" {
  event_source_arn                   = module.supplier_requests_queue.sqs_queue_arn
  function_name                      = module.letter_status_update.function_arn
  batch_size                         = 10
  scaling_config { maximum_concurrency = 10 }

  depends_on = [
    module.supplier_requests_queue, # ensures queue exists
    module.letter_status_update     # ensures update handler exists
  ]
}
