resource "aws_api_gateway_domain_name" "main" {
  regional_certificate_arn = aws_acm_certificate_validation.main.certificate_arn
  domain_name              = local.root_domain_name
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  mutual_tls_authentication {
      truststore_uri     = var.manually_configure_mtls_truststore ? "s3://${local.acct.s3_buckets["truststore"]["id"]}/${var.ca_pem_filename}" : "s3://${local.acct.s3_buckets["truststore"]["id"]}/${aws_s3_object.placeholder_truststore[0].key}"
      truststore_version = var.manually_configure_mtls_truststore ? data.aws_s3_object.external_ca_cert[0].version_id : aws_s3_object.placeholder_truststore[0].version_id
  }
}

data "aws_s3_object" "external_ca_cert" {
  count = var.manually_configure_mtls_truststore ? 1 : 0

  bucket = local.acct.s3_buckets["truststore"]["id"]
  key = "${local.csi}/${var.ca_pem_filename}"
}
