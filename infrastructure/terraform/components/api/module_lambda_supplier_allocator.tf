module "supplier_allocator" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip"

  function_name = "supplier-allocator"
  description   = "Allocate a letter to a supplier"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.sqs_supplier_allocator_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "supplier-allocator/dist"
  function_include_common = true
  handler_function_name   = "supplierAllocatorHandler"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {
    VARIANT_MAP              = jsonencode(var.letter_variant_map)
    UPSERT_LETTERS_QUEUE_URL = module.sqs_letter_updates.sqs_queue_url
  })
}

data "aws_iam_policy_document" "sqs_supplier_allocator_lambda" {
  statement {
    sid    = "KMSPermissions"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]

    resources = [
      module.kms.key_arn,
    ]
  }

  statement {
    sid    = "AllowSQSRead"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]

    resources = [
      module.sqs_letter_updates.sqs_queue_arn
    ]
  }

  statement {
    sid    = "AllowSQSWrite"
    effect = "Allow"

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      module.sqs_supplier_allocator.sqs_queue_arn
    ]
  }
}
