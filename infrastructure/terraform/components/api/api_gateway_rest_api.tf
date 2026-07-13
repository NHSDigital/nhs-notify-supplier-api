locals {
  rest_api_security_policy = "TLS_1_2"
}

resource "terraform_data" "rest_api_security_policy" {
  input = {
    security_policy = local.rest_api_security_policy
  }
}
resource "aws_api_gateway_rest_api" "main" {
  name                         = local.csi
  body                         = local.openapi_spec
  description                  = "Suppliers API"
  disable_execute_api_endpoint = var.disable_gateway_execute_endpoint
  security_policy              = local.rest_api_security_policy

  lifecycle {
    replace_triggered_by = [terraform_data.rest_api_security_policy]
  }
}
