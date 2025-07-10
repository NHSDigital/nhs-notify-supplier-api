resource "aws_api_gateway_domain_name" "main" {
  regional_certificate_arn = aws_acm_certificate_validation.main.certificate_arn
  domain_name              = local.root_domain_name
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
