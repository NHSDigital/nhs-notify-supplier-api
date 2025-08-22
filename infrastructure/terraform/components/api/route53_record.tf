resource "aws_route53_record" "main" {
  name    = var.manually_configure_mtls_truststore ? aws_api_gateway_domain_name.main[0].regional_domain_name : aws_api_gateway_domain_name.main_nonprod[0].regional_domain_name
  type    = "A"
  zone_id = local.root_domain_id

  alias {
    name    = var.manually_configure_mtls_truststore ? aws_api_gateway_domain_name.main[0].regional_domain_name : aws_api_gateway_domain_name.main_nonprod[0].regional_domain_name
    zone_id = var.manually_configure_mtls_truststore ? aws_api_gateway_domain_name.main[0].regional_zone_id : aws_api_gateway_domain_name.main_nonprod[0].regional_zone_id

    evaluate_target_health = true
  }
}
