resource "aws_s3_bucket" "event_reporting" {
  bucket = "${local.csi_global}-event-reporting"

  tags = merge(local.default_tags, { "Enable-Backup" = var.enable_backups }, { "Enable-S3-Continuous-Backup" = var.enable_backups })
}
resource "aws_s3_bucket_ownership_controls" "event_reporting" {
  bucket = aws_s3_bucket.event_reporting.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}
resource "aws_s3_bucket_versioning" "event_reporting" {
  bucket = aws_s3_bucket.event_reporting.id

  versioning_configuration {
    status = "Enabled"
  }
}
