resource "aws_api_gateway_domain_name" "main" {
  regional_certificate_arn = aws_acm_certificate_validation.main.certificate_arn
  domain_name              = local.root_domain_name
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  depends_on = [
    aws_s3_bucket.truststore
  ]

  mutual_tls_authentication {
      truststore_uri     = "s3://${aws_s3_bucket.truststore[0].id}/${aws_s3_object.placeholder_truststore[0].id}"
      truststore_version = aws_s3_object.placeholder_truststore[0].version_id
  }

  lifecycle {
    ignore_changes = [
      mutual_tls_authentication
    ]
  }
}
