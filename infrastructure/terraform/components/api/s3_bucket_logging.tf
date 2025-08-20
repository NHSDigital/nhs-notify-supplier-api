resource "aws_s3_bucket" "logging" {
  bucket = "${local.csi_s3}-bucket-logs"
  tags   = merge(local.default_tags, { "Enable-Backup" = var.enable_backups }, { "Enable-S3-Continuous-Backup" = var.enable_backups }, { "SKIP_S3_AUDIT" = "true" })
}

resource "aws_s3_bucket_logging" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  target_bucket = aws_s3_bucket.logging.bucket
  target_prefix = "truststore/${aws_s3_bucket.truststore.bucket}/"
}
