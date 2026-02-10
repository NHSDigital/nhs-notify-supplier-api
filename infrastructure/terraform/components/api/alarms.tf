locals {
  lambda_alarm_targets = {
    authorizer_lambda          = module.authorizer_lambda.function_name
    get_letter                 = module.get_letter.function_name
    get_letters                = module.get_letters.function_name
    get_letter_data            = module.get_letter_data.function_name
    get_status                 = module.get_status.function_name
    patch_letter               = module.patch_letter.function_name
    post_letters               = module.post_letters.function_name
    post_mi                    = module.post_mi.function_name
    upsert_letter              = module.upsert_letter.function_name
    letter_status_update       = module.letter_status_update.function_name
    letter_updates_transformer = module.letter_updates_transformer.function_name
    mi_updates_transformer     = module.mi_updates_transformer.function_name
  }

  sqs_queue_names = {
    letter_updates        = module.sqs_letter_updates.sqs_queue_name
    letter_status_updates = module.letter_status_updates_queue.sqs_queue_name
  }
}

module "lambda_alarms" {
  for_each   = local.lambda_alarm_targets
  source     = "../../modules/alarms-lambda"

  alarm_prefix   = local.csi
  function_name  = each.value
  log_group_name = "/aws/lambda/${each.value}"
  tags           = local.default_tags
}

module "ddb_alarms_letters" {
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.letters.name
  tags         = local.default_tags
}

module "ddb_alarms_mi" {
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.mi.name
  tags         = local.default_tags
}

module "ddb_alarms_suppliers" {
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.suppliers.name
  tags         = local.default_tags
}

module "sqs_alarms" {
  for_each   = local.sqs_queue_names
  source     = "../../modules/alarms-sqs"

  alarm_prefix   = local.csi
  queue_name     = each.value
  dlq_queue_name = replace(each.value, "-queue", "-dlq")
  tags           = local.default_tags
}

module "apigw_alarms" {
  source       = "../../modules/alarms-apigw"
  alarm_prefix = local.csi
  api_name     = aws_api_gateway_rest_api.main.name
  stage_name   = aws_api_gateway_stage.main.stage_name
  tags         = local.default_tags
}
