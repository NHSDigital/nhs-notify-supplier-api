module "sqs_supplier_allocator" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.26/terraform-sqs.zip"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  name           = "supplier-allocator"

  sqs_kms_key_arn = module.kms.key_arn

  visibility_timeout_seconds = 60

  create_dlq          = true
  sqs_policy_overload = data.aws_iam_policy_document.supplier_allocator_queue_policy.json
}

data "aws_iam_policy_document" "supplier_allocator_queue_policy" {
  version = "2012-10-17"
  statement {
    sid    = "AllowSNSToSendMessage"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-${var.component}-supplier-allocator-queue"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [module.eventsub.sns_topic.arn]
    }
  }

  statement {
    sid    = "AllowSNSPermissions"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage",
      "sqs:ListQueueTags",
      "sqs:GetQueueUrl",
      "sqs:GetQueueAttributes",
    ]

    resources = [
      "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-${var.component}-supplier-allocator-queue"
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [module.eventsub.sns_topic.arn]
    }
  }
}
