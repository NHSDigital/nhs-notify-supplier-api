resource "aws_api_gateway_base_path_mapping" "main" {
  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = var.manually_configure_mtls_truststore ? aws_api_gateway_domain_name.main.0.domain_name : aws_api_gateway_domain_name.main_nonprod.0.domain_name
}
