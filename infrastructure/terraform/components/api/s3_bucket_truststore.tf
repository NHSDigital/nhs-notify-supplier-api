resource "aws_s3_bucket" "truststore" {
  bucket = "${local.csi_s3}-truststore"
  tags   = merge(local.default_tags, { "Enable-Backup" = var.enable_backups }, { "Enable-S3-Continuous-Backup" = var.enable_backups }, { "SKIP_S3_AUDIT" = "true" })
}

resource "aws_s3_bucket_ownership_controls" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = module.kms.key_id
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "truststore" {
  depends_on = [
    aws_s3_bucket_policy.truststore
  ]

  bucket = aws_s3_bucket.truststore.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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

resource "aws_s3_bucket_policy" "truststore" {
  bucket = aws_s3_bucket.truststore.id
  policy = data.aws_iam_policy_document.truststore.json
}

resource "aws_s3_bucket_logging" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  target_bucket = aws_s3_bucket.logging.bucket
  target_prefix = "${aws_s3_bucket.truststore.bucket}/"
}
