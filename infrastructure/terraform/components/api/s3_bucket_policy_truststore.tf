resource "aws_s3_bucket_policy" "truststore" {
  bucket = aws_s3_bucket.truststore[0].id
  policy = data.aws_iam_policy_document.truststore[0].json
}

data "aws_iam_policy_document" "truststore" {
  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.truststore[0].arn,
      "${aws_s3_bucket.truststore[0].arn}/*",
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
