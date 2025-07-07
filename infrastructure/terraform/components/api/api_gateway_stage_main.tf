resource "aws_api_gateway_stage" "main" {
  stage_name    = "main"
  description   = "Templates API stage ${var.environment}"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_access.arn

    # Context variables reference - https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html#context-variable-reference
    format = jsonencode({
      "accountId" : "$context.accountId"
      "apiId" : "$context.apiId"
      "authorize" : {
        "error" : "$context.authorize.error"
        "latency" : "$context.authorize.latency"
        "status" : "$context.authorize.status"
      }
      "authorizer" : {
        "error" : "$context.authorizer.error"
        "integrationLatency" : "$context.authorizer.integrationLatency"
        "integrationStatus" : "$context.authorizer.integrationStatus"
        "latency" : "$context.authorizer.latency"
        "principalId" : "$context.authorizer.principalId"
        "requestId" : "$context.authorizer.requestId"
        "status" : "$context.authorizer.status"
      }
      "awsEndpointRequestId" : "$context.awsEndpointRequestId"
      "deploymentId" : "$context.deploymentId"
      "domainName" : "$context.domainName"
      "domainPrefix" : "$context.domainPrefix"
      "endpointType" : "$context.endpointType"
      "error" : {
        "message" : "$context.error.message"
        "responseType" : "$context.error.responseType"
        "validationErrorString" : "$context.error.validationErrorString"
      }
      "extendedRequestId" : "$context.extendedRequestId"
      "httpMethod" : "$context.httpMethod"
      "identity" : {
        "sourceIp" : "$context.identity.sourceIp"
        "userAgent" : "$context.identity.userAgent"
      }
      "integration" : {
        "error" : "$context.integration.error"
        "integrationStatus" : "$context.integration.integrationStatus"
        "latency" : "$context.integration.latency"
        "requestId" : "$context.integration.requestId"
        "status" : "$context.integration.status"
      }
      "path" : "$context.path"
      "protocol" : "$context.protocol"
      "requestId" : "$context.requestId"
      "requestTime" : "$context.requestTime"
      "requestTimeEpoch" : "$context.requestTimeEpoch"
      "responseLatency" : "$context.responseLatency"
      "responseLength" : "$context.responseLength"
      "resourceId" : "$context.resourceId"
      "resourcePath" : "$context.resourcePath"
      "stage" : "$context.stage"
      "status" : "$context.status"
    })
  }
}
