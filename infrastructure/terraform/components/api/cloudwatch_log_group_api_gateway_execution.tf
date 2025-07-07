resource "aws_cloudwatch_log_group" "api_gateway_execution" {
  name = format("API-Gateway-Execution-Logs_%s/%s",
    aws_api_gateway_rest_api.main.id,
    var.environment,
  )
  retention_in_days = var.log_retention_in_days
}
