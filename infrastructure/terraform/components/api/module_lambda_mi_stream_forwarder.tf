module "mi_stream_forwarder" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-lambda.zip"

  function_name = "mi-stream-forwarder"
  description   = "Kinesis stream forwarder for DDB mi status updates"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.mi_stream_forwarder_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "mi-stream-forwarder/dist"
  function_include_common = true
  handler_function_name   = "handler"
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
    MI_CHANGE_STREAM_ARN = "${aws_kinesis_stream.mi_change_stream.arn}"
  })
}

data "aws_iam_policy_document" "mi_stream_forwarder_lambda" {

  statement {
    sid    = "AllowDynamoDBStream"
    effect = "Allow"

    actions = [
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:DescribeStream",
      "dynamodb:ListStreams",
    ]

    resources = [
      "${aws_dynamodb_table.mi.arn}/stream/*"
    ]
  }

  statement {
    sid    = "AllowKinesisPut"
    effect = "Allow"

    actions = [
      "kinesis:DescribeStream",
      "kinesis:PutRecord",
    ]

    resources = [
      aws_kinesis_stream.mi_change_stream.arn
    ]
  }
}
