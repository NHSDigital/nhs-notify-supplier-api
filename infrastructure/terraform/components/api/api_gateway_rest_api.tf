
resource "aws_api_gateway_rest_api" "main" {
  name                         = local.csi
  body                         = local.openapi_spec
  description                  = "Suppliers API"
  disable_execute_api_endpoint = var.disable_gateway_execute_endpoint
  security_policy              = "SecurityPolicy_TLS12_PFS_2025_EDGE"
  endpoint_access_mode         = "STRICT"
}
