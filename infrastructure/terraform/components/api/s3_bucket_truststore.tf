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

# In manually configured (e.g. dev main, nonprod main, prod main) add lifecycle policy to permit manual management of cert
resource "aws_s3_object" "placeholder_truststore" {
  count   = var.manually_configure_mtls_truststore ? 1 : 0
  bucket  = aws_s3_bucket.truststore.bucket
  key     = "truststore.pem"
  content = module.supplier_ssl[0].cacert_pem

  depends_on = [
    aws_s3_bucket_versioning.truststore,
    module.supplier_ssl
  ]

  lifecycle {
    ignore_changes = [
      content
    ]
  }
}

# In non-manually configured env (e.g. PR) exclude lifecycle policy so resources are managed
# Requires duplicate block as lifecycle policies cannot be dynamic
resource "aws_s3_object" "placeholder_truststore_nonprod" {
  count   = !var.manually_configure_mtls_truststore ? 1 : 0
  bucket  = aws_s3_bucket.truststore.bucket
  key     = "truststore.pem"
  content = module.supplier_ssl[0].cacert_pem

  depends_on = [
    aws_s3_bucket_versioning.truststore,
    module.supplier_ssl
  ]
}
