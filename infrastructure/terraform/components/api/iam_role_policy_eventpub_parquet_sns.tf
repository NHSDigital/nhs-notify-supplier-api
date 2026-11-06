resource "aws_iam_role_policy" "eventpub_parquet_sns" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name   = "${local.csi}-eventpub-parquet-sns"
  role   = aws_iam_role.eventpub_parquet_sns[0].id
  policy = data.aws_iam_policy_document.eventpub_parquet_sns[0].json
}

data "aws_iam_policy_document" "eventpub_parquet_sns" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  statement {
    sid    = "AllowFirehoseDelivery"
    effect = "Allow"

    actions = [
      "firehose:PutRecord",
      "firehose:PutRecordBatch",
    ]

    resources = [aws_kinesis_firehose_delivery_stream.eventpub_parquet[0].arn]
  }

  statement {
    sid       = "AllowKms"
    effect    = "Allow"
    actions   = ["kms:GenerateDataKey", "kms:Decrypt"]
    resources = [module.kms.key_arn]
  }
}
