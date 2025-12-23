module "get_letter_data" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip"

  function_name = "get_letter_data"
  description   = "Get the letter data"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.get_letter_data_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "api-handler/dist"
  function_include_common = true
  handler_function_name   = "getLetterData"
  runtime                 = "nodejs22.x"
  memory                  = 128
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  send_to_firehose          = true
  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {})
}

data "aws_iam_policy_document" "get_letter_data_lambda" {
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
      "dynamodb:Query"
    ]

    resources = [
      aws_dynamodb_table.letters.arn,
      "${aws_dynamodb_table.letters.arn}/index/supplierStatus-index"
    ]
  }

  statement {
    sid = "S3ListBucketForPresign"
    actions = [
      "s3:ListBucket"
    ]
    resources = [
      module.s3bucket_test_letters.arn,
      local.core_pdf_bucket_arn
    ]
  }

  statement {
    sid = "S3GetObjectForPresign"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ] # allows 404 response instead of 403 if object missing
    resources = [
      "${module.s3bucket_test_letters.arn}/*",
      "${local.core_pdf_bucket_arn}/*",
    ]
  }

  statement {
    sid = "KMSForCoreS3Access"
    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]
    resources = [
      "arn:aws:kms:${var.region}:${var.core_account_id}:key/*"
    ]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = [local.core_s3_kms_key_alias_name]
    }
  }
}
