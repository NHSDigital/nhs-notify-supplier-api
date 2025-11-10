module "letter_status_updates_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip"

  name = "letter_status_updates_queue"
  description   = "Queue to transport update letter status messages"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  sqs_kms_key_arn = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.letter_status_updates_queue.json
  }
}

data "aws_iam_policy_document" "letter_status_updates_queue" {

  statement {
    sid    = "KMSPermissions"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]

    resources = [
      module.kms.key_arn, ## Requires shared kms module
    ]
  }
}
