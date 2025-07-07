locals {
    aws_lambda_functions_dir_path = "../../../../lambdas"

    openapi_spec = templatefile("${path.module}/resources/spec.tmpl.json", {
        APIG_EXECUTION_ROLE_ARN  = aws_iam_role.api_gateway_execution_role.arn
        AWS_REGION               = var.region
        # AUTHORIZER_LAMBDA_ARN    = module.authorizer_lambda.function_arn
        HELLO_WORLD_LAMBDA_ARN    = module.hello_world.function_arn
    })
}