resource "aws_s3_bucket_policy" "truststore" {
  bucket = aws_s3_bucket.truststore.id
  policy = data.aws_iam_policy_document.truststore.json
}

data "aws_iam_policy_document" "truststore" {
  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.truststore.arn,
      "${aws_s3_bucket.truststore.arn}/*",
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        false
      ]
    }
  }
}
