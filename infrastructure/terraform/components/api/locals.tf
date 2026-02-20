locals {
  aws_lambda_functions_dir_path = "../../../../lambdas"
  root_domain_name              = "${var.environment}.${local.acct.route53_zone_names["supplier-api"]}" # e.g. [main|dev|abxy0].supplier-api.[dev|nonprod|prod].nhsnotify.national.nhs.uk
  root_domain_id                = local.acct.route53_zone_ids["supplier-api"]
  root_domain_nameservers       = local.acct.route53_zone_nameservers["supplier-api"]

  openapi_spec = templatefile("${path.module}/resources/spec.tmpl.json", {
    APIG_EXECUTION_ROLE_ARN    = aws_iam_role.api_gateway_execution_role.arn
    AWS_REGION                 = var.region
    AUTHORIZER_LAMBDA_ARN      = module.authorizer_lambda.function_arn
    GET_LETTER_LAMBDA_ARN      = module.get_letter.function_arn
    GET_LETTERS_LAMBDA_ARN     = module.get_letters.function_arn
    GET_LETTER_DATA_LAMBDA_ARN = module.get_letter_data.function_arn
    GET_STATUS_LAMBDA_ARN      = module.get_status.function_arn
    PATCH_LETTER_LAMBDA_ARN    = module.patch_letter.function_arn
    POST_LETTERS_LAMBDA_ARN    = module.post_letters.function_arn
    POST_MI_LAMBDA_ARN         = module.post_mi.function_arn
  })

  destination_arn = "arn:aws:logs:${var.region}:${var.shared_infra_account_id}:destination:nhs-main-obs-firehose-logs"

  common_lambda_env_vars = {
    LETTERS_TABLE_NAME         = aws_dynamodb_table.letters.name,
    MI_TABLE_NAME              = aws_dynamodb_table.mi.name,
    LETTER_TTL_HOURS           = 12960, # 18 months * 30 days * 24 hours
    MI_TTL_HOURS               = 2160   # 90 days * 24 hours
    SUPPLIER_ID_HEADER         = "nhsd-supplier-id",
    APIM_CORRELATION_HEADER    = "nhsd-correlation-id",
    DOWNLOAD_URL_TTL_SECONDS   = 60
    SNS_TOPIC_ARN              = "${module.eventsub.sns_topic.arn}",
    EVENT_SOURCE               = "/data-plane/supplier-api/${var.group}/${var.environment}/letters"
    SUPPLIER_CONFIG_TABLE_NAME = aws_dynamodb_table.supplier-configuration.name
  }

  core_pdf_bucket_arn        = "arn:aws:s3:::comms-${var.core_account_id}-eu-west-2-${var.core_environment}-api-stg-pdf-pipeline"
  core_s3_kms_key_alias_name = "alias/comms-${var.core_environment}-api-s3"

  event_cache_bucket_name          = lookup(module.eventpub.s3_bucket_event_cache, "bucket", null)
  eventsub_event_cache_bucket_name = lookup(module.eventsub.s3_bucket_event_cache, "bucket", null)
}
