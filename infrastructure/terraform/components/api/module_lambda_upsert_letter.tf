module "upsert_letter" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip"

  function_name = "upsert_letter"
  description   = "Update or Insert the letter data in the letters table"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.upsert_letter_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "upsert-letter/dist"
  function_include_common = true
  handler_function_name   = "upsertLetterHandler"
  runtime                 = "nodejs22.x"
  memory                  = 128
  timeout                 = 5
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  send_to_firehose          = true
  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {
    VARIANT_MAP = jsonencode(var.variant_map)
  })
}

variable "variant_map" {
  type = map(object({ supplier_id = string, spec_id = string }))
  default = {
    "lv1" = { supplierId = "supplier1", specId = "spec1" },
    "lv2" = { supplierId = "supplier1", specId = "spec2" },
    "lv3" = { supplierId = "supplier2", specId = "spec3" }
  }
}

data "aws_iam_policy_document" "upsert_letter_lambda" {
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
    sid    = "AllowDynamoDBWrite"
    effect = "Allow"

    actions = [
      "dynamodb:PutItem"
    ]

    resources = [
      aws_dynamodb_table.letters.arn,
      "${aws_dynamodb_table.letters.arn}/index/supplierStatus-index"
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
}
