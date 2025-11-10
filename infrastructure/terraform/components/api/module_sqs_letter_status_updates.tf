# Queue to transport update letter status messages
module "letter_status_updates_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip"

  name = "letter_status_updates_queue"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  sqs_kms_key_arn = module.kms.key_arn
}
