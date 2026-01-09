resource "aws_sns_topic_subscription" "supplier_events_forwarder_lambda" {
  topic_arn = module.eventsub.sns_topic_supplier.arn
  protocol  = "lambda"
  endpoint  = module.supplier_events_forwarder_lambda.function_arn
}

resource "aws_lambda_permission" "supplier_events_forwarder_lambda_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = module.supplier_events_forwarder_lambda.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.eventsub.sns_topic_supplier.arn
}
