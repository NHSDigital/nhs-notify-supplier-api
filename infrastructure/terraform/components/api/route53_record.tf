resource "aws_route53_record" "main" {
  name    = aws_api_gateway_domain_name.main_nonprod[0].regional_domain_name
  type    = "A"
  zone_id = local.root_domain_id

  alias {
    name    = aws_api_gateway_domain_name.main_nonprod[0].regional_domain_name
    zone_id = aws_api_gateway_domain_name.main_nonprod[0].regional_zone_id

    evaluate_target_health = true
  }
}
