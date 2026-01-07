resource "aws_sns_topic_subscription" "allocation_lambda" {
  topic_arn = module.eventsub.sns_topic_event_bus.arn
  protocol  = "lambda"
  endpoint  = module.allocation_lambda.function_arn
}

resource "aws_lambda_permission" "allocation_lambda_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = module.allocation_lambda.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.eventsub.sns_topic_event_bus.arn
}
