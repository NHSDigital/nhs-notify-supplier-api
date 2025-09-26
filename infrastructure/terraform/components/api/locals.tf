locals {
  aws_lambda_functions_dir_path = "../../../../lambdas"
  root_domain_name              = "${var.environment}.${local.acct.route53_zone_names["supplier-api"]}" # e.g. [main|dev|abxy0].supplier-api.[dev|nonprod|prod].nhsnotify.national.nhs.uk
  root_domain_id                = local.acct.route53_zone_ids["supplier-api"]
  root_domain_nameservers       = local.acct.route53_zone_nameservers["supplier-api"]

  openapi_spec = templatefile("${path.module}/resources/spec.tmpl.json", {
    APIG_EXECUTION_ROLE_ARN  = aws_iam_role.api_gateway_execution_role.arn
    AWS_REGION               = var.region
    AUTHORIZER_LAMBDA_ARN    = module.authorizer_lambda.function_arn
    GET_LETTERS_LAMBDA_ARN  = module.get_letters.function_arn
    PATCH_LETTERS_LAMBDA_ARN  = module.patch_letters.function_arn
  })

  destination_arn = "arn:aws:logs:${var.region}:${var.shared_infra_account_id}:destination:nhs-main-obs-firehose-logs"

  common_db_access_lambda_env_vars = {
    LETTERS_TABLE_NAME = aws_dynamodb_table.letters.name,
    LETTER_TTL_HOURS = 24,
    SUPPLIER_ID_HEADER = "nhsd-supplier-id"
    SUPPLIER_ID_HEADER = "nhsd-correlation-id"
  }
}
