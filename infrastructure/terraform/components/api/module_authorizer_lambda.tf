module "authorizer_lambda" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-lambda.zip"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  function_name = "authorizer"
  description   = "Authorizer for Suppliers API"

  memory  = 512
  timeout = 20
  runtime = "nodejs22.x"

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "authorizer/dist"
  function_module_name    = "index"
  handler_function_name   = "handler"

  enable_lambda_insights   = false
  force_lambda_code_deploy = var.force_lambda_code_deploy

  send_to_firehose          = true
  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn
}
