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
