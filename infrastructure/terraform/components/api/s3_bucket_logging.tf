resource "aws_s3_bucket" "logging" {
  bucket = "${local.csi_s3}-bucket-logs"
  tags   = merge(local.default_tags, { "Enable-Backup" = var.enable_backups }, { "Enable-S3-Continuous-Backup" = var.enable_backups }, { "SKIP_S3_AUDIT" = "true" })
}

resource "aws_s3_bucket_ownership_controls" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = module.kms.key_id
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "logging" {
  depends_on = [
    aws_s3_bucket_policy.logging
  ]

  bucket = aws_s3_bucket.logging.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

###
# Bucket logging definitions past here
###

resource "aws_s3_bucket_logging" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  target_bucket = aws_s3_bucket.logging.bucket
  target_prefix = "truststore/${aws_s3_bucket.truststore.bucket}/"
}
