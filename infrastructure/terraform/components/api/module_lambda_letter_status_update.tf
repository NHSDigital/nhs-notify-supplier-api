module "letter_status_update" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip"

  function_name = "letter_status_update"
  description   = "Processes letter status updates"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.letter_status_update.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "api-handler/dist"
  function_include_common = true
  handler_function_name   = "letterStatusUpdate"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {})
}

data "aws_iam_policy_document" "letter_status_update" {
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
    sid    = "AllowDynamoDBAccess"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
    ]

    resources = [
      aws_dynamodb_table.letters.arn,
    ]
  }

  statement {
    sid    = "AllowQueueAccess"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility"
    ]

    resources = [
      module.letter_status_updates_queue.sqs_queue_arn
    ]
  }
}
