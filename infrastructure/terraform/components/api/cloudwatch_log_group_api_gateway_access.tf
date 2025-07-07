resource "aws_cloudwatch_log_group" "api_gateway_access" {
  name              = "/aws/api-gateway/${aws_api_gateway_rest_api.main.id}/${var.environment}/access-logs"
  retention_in_days = var.log_retention_in_days
}
