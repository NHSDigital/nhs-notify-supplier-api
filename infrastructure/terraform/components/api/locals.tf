locals {
  aws_lambda_functions_dir_path = "../../../../lambdas"
  root_domain_name              = "${var.environment}.${local.acct.route53_zone_names["supplier-api"]}" # e.g. [main|dev|abxy0].supplier-api.[dev|nonprod|prod].nhsnotify.national.nhs.uk
  root_domain_nameservers       = "${var.environment}.${local.acct.route53_zone_nameservers["supplier-api"]}"

  openapi_spec = templatefile("${path.module}/resources/spec.tmpl.json", {
    APIG_EXECUTION_ROLE_ARN = aws_iam_role.api_gateway_execution_role.arn
    AWS_REGION              = var.region
    AUTHORIZER_LAMBDA_ARN   = module.authorizer_lambda.function_arn
    HELLO_WORLD_LAMBDA_ARN  = module.hello_world.function_arn
  })

  destination_arn = "arn:aws:logs:${var.region}:${var.shared_infra_account_id}:destination:nhs-main-obs-firehose-logs"
}
