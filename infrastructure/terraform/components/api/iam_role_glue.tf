resource "aws_iam_role" "glue_role" {
  name               = "${local.csi}-glue-role"
  assume_role_policy = data.aws_iam_policy_document.glue_assume_role.json
}

data "aws_iam_policy_document" "glue_assume_role" {
  statement {
    sid    = "AllowGlueServiceAssumeRole"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["glue.amazonaws.com"]
    }

    actions = [
      "sts:AssumeRole",
    ]
  }
}

resource "aws_iam_policy" "glue_service_policy" {
  name        = "${local.csi}-glue-service-policy"
  description = "Policy for ${local.csi} Glue Service Role"
  policy      = data.aws_iam_policy_document.glue_service_policy.json
}

data "aws_iam_policy_document" "glue_service_policy" {
  statement {
    sid    = "AllowGlueLogging"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid    = "AllowListBucketAndGetLocation"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      "arn:aws:s3:::${local.event_cache_bucket_name}",
      "arn:aws:s3:::${local.eventsub_event_cache_bucket_name}"
    ]
  }
  statement {
    sid    = "AllowS3Access"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${local.event_cache_bucket_name}/*",
      "arn:aws:s3:::${local.eventsub_event_cache_bucket_name}/*"
    ]
  }
  statement {
    sid    = "GlueCatalogAccess"
    effect = "Allow"
    actions = [
      "glue:GetDatabase",
      "glue:GetDatabases",
      "glue:GetTable",
      "glue:GetTables",
      "glue:CreateTable",
      "glue:UpdateTable",
      "glue:CreatePartition",
      "glue:BatchCreatePartition",
      "glue:GetPartition",
      "glue:BatchGetPartition",
      "glue:UpdatePartition"
    ]
    resources = ["*"]
  }
  statement {
    sid    = "S3TempAndGlueETL"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::aws-glue-*",
      "arn:aws:s3:::aws-glue-*/*"
    ]
  }
}

resource "aws_iam_role_policy_attachment" "gllue_attach_policy" {
  role       = aws_iam_role.glue_role.name
  policy_arn = aws_iam_policy.glue_service_policy.arn
}
