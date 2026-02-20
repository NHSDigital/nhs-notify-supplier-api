module "lambda_alarms" {
  for_each = local.lambda_alarm_targets
  source   = "../../modules/alarms-lambda"

  alarm_prefix   = local.csi
  function_name  = each.value
  log_group_name = "/aws/lambda/${each.value}"
  tags           = local.default_tags
}
