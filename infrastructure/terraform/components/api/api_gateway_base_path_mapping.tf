resource "aws_api_gateway_base_path_mapping" "main" {
  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.main.domain_name
  depends_on = [
    aws_api_gateway_stage.main,
    aws_api_gateway_domain_name.main
  ]

  lifecycle {
    replace_triggered_by = [aws_api_gateway_rest_api.main]
  }
}
