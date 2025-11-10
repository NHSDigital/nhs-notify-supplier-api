resource "aws_lambda_event_source_mapping" "status_update_sqs_to_status_update_handler" {
  event_source_arn                   = module.letter_status_updates_queue.sqs_queue_arn
  function_name                      = module.letter_status_update.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 1
  scaling_config { maximum_concurrency = 10 }
}

depends_on = [
  module.letter_status_updates_queue,         # ensures queue exists
  module.letter_status_update                 # ensures update handler exists
  # aws_iam_role_policy.letter_status_update, # ensures permissions exist?
  # aws_iam_role_policy.post_letters_receiver # ensures permissions exist?
]
