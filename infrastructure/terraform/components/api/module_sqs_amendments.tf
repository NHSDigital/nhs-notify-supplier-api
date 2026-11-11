# Queue to transport letter status amendment messages
module "amendments_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/3.1.5/terraform-sqs.zip"

  name = "amendments_queue"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  sqs_kms_key_arn = module.kms.key_arn

  create_dlq                        = true
  enable_queue_oldest_message_alarm = false
}
