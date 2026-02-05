module "sqs_allocated_letters" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-sqs.zip"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  name           = "allocated-letters"

  sqs_kms_key_arn = module.kms.key_arn

  visibility_timeout_seconds = 60

  create_dlq = true
}
