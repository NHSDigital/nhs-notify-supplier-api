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
      kms_master_key_id = var.truststore_s3_bucket_config.kms_key_id
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

resource "aws_s3_bucket_logging" "truststore" {
  bucket = aws_s3_bucket.truststore.id

  target_bucket = var.truststore_s3_bucket_config.bucket_logs_bucket_name
  target_prefix = "truststore/${aws_s3_bucket.truststore[0].bucket}/"
}

# If Environment is to be Manually configured, need to create a placeholder truststore file for mtls
resource "aws_s3_object" "placeholder_truststore" {
  count   = var.manually_configure_mtls_truststore ? 1 : 0
  bucket  = aws_s3_bucket.truststore.bucket
  key     = "truststore.pem"
  content = tls_self_signed_cert.placeholder_cert.cert_pem

  depends_on = [
    aws_s3_bucket_versioning.truststore
  ]

  lifecycle {
    ignore_changes = [
      content
    ]
  }
}

# If env is not manually configured, use the certs generated from the ssl module
# Having a duplicate resource here as lifcycle rules can't be dynamic or variable
# We don't want to ignore content in nonprod, but we do for prod as we will manually update certs and not via ssl module
resource "aws_s3_object" "placeholder_truststore_nonprod" {
  count   = var.manually_configure_mtls_truststore ? 0 : 1
  bucket  = aws_s3_bucket.truststore.bucket
  key     = "truststore.pem"
  content = module.supplier_ssl.cacert_pem

  depends_on = [
    aws_s3_bucket_versioning.truststore,
    module.supplier_ssl
  ]
}
