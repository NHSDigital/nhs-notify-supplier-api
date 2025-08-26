# In manually configured (e.g. dev main, nonprod main, prod main) add lifecycle policy to permit manual management of cert
resource "aws_s3_object" "placeholder_truststore" {
  count   = var.manually_configure_mtls_truststore ? 0 : 1

  bucket  = local.acct.s3_buckets["truststore"]["id"]
  key     = "${local.csi}/truststore.pem"
  content = module.supplier_ssl[0].cacert_pem

  lifecycle {
    ignore_changes = [
      content
    ]
  }

  depends_on = [
    module.domain_truststore,
    module.supplier_ssl
  ]
}
