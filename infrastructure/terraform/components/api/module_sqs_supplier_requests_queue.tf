# Queue to transport update letter status messages
module "supplier_requests_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip"

  name = "supplier-requests"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  fifo_queue                  = true
  content_based_deduplication = true

  sqs_kms_key_arn = module.kms.key_arn

  create_dlq = true
}
