locals {
  # Endpoint type for the REST API
  # Security policy is managed at the custom domain level (see api_gateway_domain.tf: security_policy = "TLS_1_2")
  # STRICT endpoint access mode is not supported with REGIONAL endpoints
  rest_api_endpoint_type = "REGIONAL"
}

resource "terraform_data" "rest_api_security_policy" {
  input = {
    endpoint_type = local.rest_api_endpoint_type
  }
}
