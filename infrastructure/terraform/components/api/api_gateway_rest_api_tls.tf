locals {
  rest_api_security_policy      = "SecurityPolicy_TLS12_PFS_2025_EDGE"
  rest_api_endpoint_access_mode = "STRICT"
}

resource "terraform_data" "rest_api_security_policy" {
  input = {
    security_policy      = local.rest_api_security_policy
    endpoint_access_mode = local.rest_api_endpoint_access_mode
  }
}
