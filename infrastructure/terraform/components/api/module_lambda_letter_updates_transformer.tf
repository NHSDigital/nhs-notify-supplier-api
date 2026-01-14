module "letter_updates_transformer" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.29/terraform-lambda.zip"

  function_name = "letter-updates-transformer"
  description   = "Letter Update Filter/Producer"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.letter_updates_transformer_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "letter-updates-transformer/dist"
  function_include_common = true
  handler_function_name   = "handler"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = merge(local.common_lambda_env_vars, {
    EVENTPUB_SNS_TOPIC_ARN = "${module.eventpub.sns_topic.arn}"
  })
}

data "aws_iam_policy_document" "letter_updates_transformer_lambda" {
  statement {
    sid    = "AllowSNSPublish"
    effect = "Allow"

    actions = [
      "sns:Publish"
    ]

    resources = [
      module.eventpub.sns_topic.arn
    ]
  }

  statement {
    sid    = "AllowKinesisGet"
    effect = "Allow"

    actions = [
      "kinesis:GetRecords",
      "kinesis:GetShardIterator",
      "kinesis:DescribeStream",
      "kinesis:DescribeStreamSummary",
      "kinesis:ListShards",
      "kinesis:ListStreams",
    ]

    resources = [
      aws_kinesis_stream.letter_change_stream.arn
    ]
  }
}
