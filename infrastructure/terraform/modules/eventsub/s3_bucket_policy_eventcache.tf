resource "aws_s3_bucket_policy" "eventcache" {
  bucket = module.s3bucket_event_cache[0].bucket
  policy = data.aws_iam_policy_document.eventcache.json
  count  = var.enable_event_cache ? 1 : 0
}

data "aws_iam_policy_document" "eventcache" {
  statement {
    sid    = "AllowGlueListBucketAndGetLocation"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [var.glue_role_arn]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      "arn:aws:s3:::${module.s3bucket_event_cache[0].bucket}"
    ]
  }

  # Object-level permissions: Get/Put/Delete objects
  statement {
    sid    = "AllowGlueObjectAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [var.glue_role_arn]
    }

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      "arn:aws:s3:::${module.s3bucket_event_cache[0].bucket}/*"
    ]
  }
}
