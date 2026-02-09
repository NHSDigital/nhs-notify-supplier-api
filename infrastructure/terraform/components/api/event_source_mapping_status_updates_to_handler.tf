resource "aws_lambda_event_source_mapping" "status_updates_sqs_to_status_update_handler" {
  event_source_arn                   = module.amendments_queue.sqs_queue_arn
  function_name                      = module.amendment_event_transformer.function_arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 1
  scaling_config { maximum_concurrency = 10 }

  depends_on = [
    module.amendments_queue, # ensures queue exists
    module.amendment_event_transformer         # ensures update handler exists
  ]
}
