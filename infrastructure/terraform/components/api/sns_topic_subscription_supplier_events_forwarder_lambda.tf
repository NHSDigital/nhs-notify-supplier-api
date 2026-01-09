resource "aws_sns_topic_subscription" "supplier_events_queue" {
  topic_arn            = module.eventsub.sns_topic_supplier.arn
  protocol             = "sqs"
  endpoint             = module.supplier_events_queue.sqs_queue_arn
  raw_message_delivery = false
}

resource "aws_lambda_event_source_mapping" "supplier_events_forwarder" {
  event_source_arn                   = module.supplier_events_queue.sqs_queue_arn
  function_name                      = module.supplier_events_forwarder_lambda.function_arn
  batch_size                         = 10
  scaling_config { maximum_concurrency = 10 }

  depends_on = [
    module.supplier_events_queue,
    module.supplier_events_forwarder_lambda
  ]
}
