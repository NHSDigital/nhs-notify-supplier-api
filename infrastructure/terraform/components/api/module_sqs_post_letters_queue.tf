module "post_letters_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.24/terraform-sqs.zip"

  name = "post_letters_queue"
  description   = "Queues a collection of letters to update"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  sqs_kms_key_arn = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.post_letters_queue.json
  }
}

data "aws_iam_policy_document" "post_letters_queue" {

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
