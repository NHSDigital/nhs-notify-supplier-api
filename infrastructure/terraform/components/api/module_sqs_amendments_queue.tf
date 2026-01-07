module "amendments_queue" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-sqs.zip"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  name           = "amendments"

  fifo_queue                  = true
  content_based_deduplication = true

  sqs_kms_key_arn = module.kms.key_arn

  visibility_timeout_seconds = 60

  create_dlq          = true
  sqs_policy_overload = data.aws_iam_policy_document.amendments_queue_policy.json
}

data "aws_iam_policy_document" "amendments_queue_policy" {
  version = "2012-10-17"
  statement {
    sid    = "AllowSNSToSendAmendments"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-${var.component}-amendments-queue.fifo"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [module.eventsub.sns_topic_supplier.arn]
    }
  }
}
