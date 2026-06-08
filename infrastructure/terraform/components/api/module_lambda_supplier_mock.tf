module "supplier_mock" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/4.0.5/terraform-lambda.zip"
  count  = var.deploy_supplier_mock_scheduler ? 1 : 0

  function_name = "supplier_mock"
  description   = "Mock the behaviour of a supplier"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.supplier_mock_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "supplier-mock/dist"
  function_include_common = true
  handler_function_name   = "supplierMockHandler"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {
    ENVIRONMENT                     = var.environment
    GET_LETTERS_FUNCTION_NAME       = module.get_letters.function_name
    PATCH_LETTER_FUNCTION_NAME      = module.patch_letter.function_name
    SUPPLIER_MOCK_CONFIG_PARAM_NAME = aws_ssm_parameter.supplier_mock_config[0].name
  })
}

data "aws_iam_policy_document" "supplier_mock_lambda" {
  statement {
    sid    = "KMSPermissions"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]

    resources = [
      module.kms.key_arn, ## Requires shared kms module
    ]
  }

  statement {
    sid    = "AllowInvokeLambda"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction",
    ]

    resources = [
      module.get_letters.function_arn,
      module.patch_letter.function_arn
    ]
  }

  statement {
    sid    = "AllowReadSupplierMockConfigParameter"
    effect = "Allow"

    actions = [
      "ssm:GetParameter",
    ]

    resources = [
      aws_ssm_parameter.supplier_mock_config[0].arn
    ]
  }
}
