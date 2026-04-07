resource "aws_cloudwatch_log_group" "api_gateway_access" {
  name              = "/aws/api-gateway/${aws_api_gateway_rest_api.main.id}/${var.environment}/access-logs"
  retention_in_days = var.log_retention_in_days
}

resource "aws_cloudwatch_log_subscription_filter" "api_gateway_access" {
  name            = replace(aws_cloudwatch_log_group.api_gateway_access.name, "/", "-")
  role_arn        = local.acct.log_subscription_role_arn
  log_group_name  = aws_cloudwatch_log_group.api_gateway_access.name
  filter_pattern  = ""
  destination_arn = local.destination_arn
}

resource "aws_cloudwatch_log_subscription_filter" "api_gateway" {
  count           = var.csoc_log_forwarding ? 1 : 0
  name            = replace(aws_cloudwatch_log_group.api_gateway_access.name, "/", "-")
  log_group_name  = aws_cloudwatch_log_group.api_gateway_access.name
  role_arn        = data.aws_iam_role.csoc_subscription[0].arn
  filter_pattern  = ""
  destination_arn = local.csoc_api_gw_log_destination_arn
}
