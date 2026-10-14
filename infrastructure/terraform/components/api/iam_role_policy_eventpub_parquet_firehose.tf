resource "aws_iam_role_policy" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name   = "${local.csi}-eventpub-parquet-firehose"
  role   = aws_iam_role.eventpub_parquet_firehose[0].id
  policy = data.aws_iam_policy_document.eventpub_parquet_firehose[0].json
}

data "aws_iam_policy_document" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  statement {
    sid    = "AllowDestinationS3Access"
    effect = "Allow"

    actions = [
      "s3:AbortMultipartUpload",
      "s3:GetBucketLocation",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads",
      "s3:PutObject",
    ]

    resources = [
      module.s3bucket_reporting.arn,
      "${module.s3bucket_reporting.arn}/parquet/*",
    ]
  }

  statement {
    sid    = "AllowKms"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:GenerateDataKey*",
    ]

    resources = [module.kms.key_arn]
  }

  statement {
    sid    = "AllowInvokeTransformer"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction",
      "lambda:GetFunctionConfiguration",
    ]

    resources = ["${module.eventpub_parquet_transformer.function_arn}:$LATEST"]
  }

  statement {
    sid    = "AllowGlueSchemaRead"
    effect = "Allow"

    actions = [
      "glue:GetTable",
      "glue:GetTableVersion",
      "glue:GetTableVersions",
    ]

    resources = [
      aws_glue_catalog_table.eventpub_parquet[0].arn,
      aws_glue_catalog_database.supplier.arn,
      "arn:aws:glue:${var.region}:${var.aws_account_id}:catalog",
    ]
  }

  statement {
    sid       = "AllowLogging"
    effect    = "Allow"
    actions   = ["logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.eventpub_parquet_firehose[0].arn}:*"]
  }
}
