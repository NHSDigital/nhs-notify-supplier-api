
resource "aws_api_gateway_rest_api" "main" {
  name                         = "${local.csi}-${local.api_gateway_endpoint_replacement_suffix}"
  body                         = local.openapi_spec
  description                  = "Suppliers API"
  disable_execute_api_endpoint = var.disable_gateway_execute_endpoint
  security_policy              = "SecurityPolicy_TLS13_1_2_2021_06"
  endpoint_access_mode         = local.api_gateway_endpoint_access_mode

  endpoint_configuration {
    types = [local.api_gateway_endpoint_type]
  }

  lifecycle {
    create_before_destroy = true
  }
}
