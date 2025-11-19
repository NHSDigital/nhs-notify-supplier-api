module "post_letters" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-lambda.zip"

  function_name = "post_letters"
  description   = "Receives and accepts collection of letters to update"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.post_letters.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "api-handler/dist"
  function_include_common = true
  handler_function_name   = "postLetters"
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
    QUEUE_URL = module.letter_status_updates_queue.sqs_queue_url,
    MAX_LIMIT = var.max_get_limit
  })
}

data "aws_iam_policy_document" "post_letters" {
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
    sid    = "AllowQueueAccess"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
    ]

    resources = [
      module.letter_status_updates_queue.sqs_queue_arn
    ]
  }
}
