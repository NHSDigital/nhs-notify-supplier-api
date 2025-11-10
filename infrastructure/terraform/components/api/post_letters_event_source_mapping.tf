resource "aws_lambda_event_source_mapping" "sqs_to_processor" {
  event_source_arn                   = module.post_letters_queue.sqs_queue_arn
  function_name                      = module.post_letters_processor.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 1
  scaling_config { maximum_concurrency = 10 }
}

depends_on = [
  module.post_letters_queue,                    # ensures queue exists
  module.post_letters_processor                 # ensures processor exists
  # aws_iam_role_policy.post_letters_processor, # ensures permissions exist
  # aws_iam_role_policy.post_letters_receiver,  # ensures permissions exist
]
