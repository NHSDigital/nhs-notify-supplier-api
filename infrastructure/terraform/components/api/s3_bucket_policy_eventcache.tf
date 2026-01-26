resource "aws_s3_bucket_policy" "eventcache" {
  bucket = "${local.csi_global}-eventcache"
  policy = data.aws_iam_policy_document.eventcache.json
}

data "aws_iam_policy_document" "eventcache" {
  statement {
    sid    = "AllowGlueListBucketAndGetLocation"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.glue_role.arn]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      "arn:aws:s3:::${local.csi_global}-eventcache"
    ]
  }

  # Object-level permissions: Get/Put/Delete objects
  statement {
    sid    = "AllowGlueObjectAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.glue_role.arn]
    }

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      "arn:aws:s3:::${local.csi_global}-eventcache/*"
    ]
  }
}
