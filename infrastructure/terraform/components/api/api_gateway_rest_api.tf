
resource "terraform_data" "api_gateway_endpoint_settings" {
  input = {
    endpoint_access_mode = "local.api_gateway_endpoint_access_mode"
    endpoint_type        = local.api_gateway_endpoint_type
  }
}

resource "aws_api_gateway_rest_api" "main" {
  name                         = local.csi
  body                         = local.openapi_spec
  description                  = "Suppliers API"
  disable_execute_api_endpoint = var.disable_gateway_execute_endpoint
  security_policy              = "SecurityPolicy_TLS12_PFS_2025_EDGE"
  endpoint_access_mode         = local.api_gateway_endpoint_access_mode

  endpoint_configuration {
    types = [local.api_gateway_endpoint_type]
  }

  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [terraform_data.api_gateway_endpoint_settings]
  }
}
