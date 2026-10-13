resource "aws_kinesis_firehose_delivery_stream" "eventpub_parquet" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name        = "${local.csi}-eventpub-parquet"
  destination = "extended_s3"

  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = module.kms.key_arn
  }

  extended_s3_configuration {
    role_arn   = aws_iam_role.eventpub_parquet_firehose[0].arn
    bucket_arn = module.s3bucket_reporting.arn

    prefix              = "parquet/eventpub/__year=!{timestamp:yyyy}/__month=!{timestamp:MM}/__day=!{timestamp:dd}/"
    error_output_prefix = "parquet/errors/eventpub/!{firehose:error-output-type}/!{timestamp:yyyy}-!{timestamp:MM}-!{timestamp:dd}/"

    buffering_size     = 128
    buffering_interval = 300

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.supplier.name
        role_arn      = aws_iam_role.eventpub_parquet_firehose[0].arn
        table_name    = aws_glue_catalog_table.eventpub_parquet[0].name
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.eventpub_parquet_firehose[0].name
      log_stream_name = aws_cloudwatch_log_stream.eventpub_parquet_firehose[0].name
    }
  }
}

resource "aws_cloudwatch_log_group" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name              = "/aws/firehose/${local.csi}-eventpub-parquet"
  kms_key_id        = module.kms.key_arn
  retention_in_days = var.log_retention_in_days
}

resource "aws_cloudwatch_log_stream" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name           = "extended_s3"
  log_group_name = aws_cloudwatch_log_group.eventpub_parquet_firehose[0].name
}

# Raw delivery so Firehose receives the bare event rather than the SNS envelope
resource "aws_sns_topic_subscription" "eventpub_parquet" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  topic_arn             = module.eventpub.sns_topic.arn
  protocol              = "firehose"
  subscription_role_arn = aws_iam_role.eventpub_parquet_sns[0].arn
  endpoint              = aws_kinesis_firehose_delivery_stream.eventpub_parquet[0].arn
  raw_message_delivery  = true
}

resource "aws_iam_role" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name               = "${local.csi}-eventpub-parquet-firehose"
  assume_role_policy = data.aws_iam_policy_document.eventpub_parquet_firehose_assume_role.json
}

data "aws_iam_policy_document" "eventpub_parquet_firehose_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["firehose.amazonaws.com"]
    }
  }
}

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

resource "aws_iam_role" "eventpub_parquet_sns" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name               = "${local.csi}-eventpub-parquet-sns"
  assume_role_policy = data.aws_iam_policy_document.eventpub_parquet_sns_assume_role.json
}

data "aws_iam_policy_document" "eventpub_parquet_sns_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
  }
}

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
