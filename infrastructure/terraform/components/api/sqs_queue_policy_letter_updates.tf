resource "aws_sqs_queue_policy" "letter_updates" {
  queue_url = module.sqs_letter_updates.sqs_queue_url

  policy = data.aws_iam_policy_document.letter_updates_queue_policy.json
}

data "aws_iam_policy_document" "letter_updates_queue_policy" {
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
      module.sqs_letter_updates.sqs_queue_arn
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
      module.sqs_letter_updates.sqs_queue_arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [module.eventsub.sns_topic.arn]
    }
  }
}
