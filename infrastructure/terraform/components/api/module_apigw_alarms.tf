module "apigw_alarms" {
  source       = "../../modules/alarms/alarms-apigw"
  alarm_prefix = local.csi
  api_name     = aws_api_gateway_rest_api.main.name
  stage_name   = aws_api_gateway_stage.main.stage_name
  tags         = local.default_tag
}
