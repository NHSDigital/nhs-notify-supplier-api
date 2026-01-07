resource "aws_sns_topic_policy" "sns_topic_event_bus" {
  arn = aws_sns_topic.sns_topic_event_bus.arn

  policy = data.aws_iam_policy_document.sns_topic_event_bus_policy.json
}

resource "aws_sns_topic_policy" "sns_topic_supplier" {
  arn = aws_sns_topic.sns_topic_supplier.arn

  policy = data.aws_iam_policy_document.sns_topic_supplier_policy.json
}

data "aws_iam_policy_document" "sns_topic_event_bus_policy" {
  policy_id = "__default_policy_ID"

  statement {
    sid    = "AllowAllSNSActionsFromAccount"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "SNS:Subscribe",
      "SNS:SetTopicAttributes",
      "SNS:RemovePermission",
      "SNS:Receive",
      "SNS:Publish",
      "SNS:ListSubscriptionsByTopic",
      "SNS:GetTopicAttributes",
      "SNS:DeleteTopic",
      "SNS:AddPermission",
    ]

    resources = [
      aws_sns_topic.sns_topic_event_bus.arn,
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceOwner"

      values = [
        var.aws_account_id,
      ]
    }
  }

  statement {
    sid    = "AllowAllSNSActionsFromSharedAccount"
    effect = "Allow"
    actions = [
      "SNS:Publish",
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.shared_infra_account_id}:root"
      ]
    }

    resources = [
      aws_sns_topic.sns_topic_event_bus.arn,
    ]
  }
}

data "aws_iam_policy_document" "sns_topic_supplier_policy" {
  policy_id = "__default_policy_ID"

  statement {
    sid    = "AllowAllSNSActionsFromAccountSupplier"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "SNS:Subscribe",
      "SNS:SetTopicAttributes",
      "SNS:RemovePermission",
      "SNS:Receive",
      "SNS:Publish",
      "SNS:ListSubscriptionsByTopic",
      "SNS:GetTopicAttributes",
      "SNS:DeleteTopic",
      "SNS:AddPermission",
    ]

    resources = [
      aws_sns_topic.sns_topic_supplier.arn,
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceOwner"

      values = [
        var.aws_account_id,
      ]
    }
  }

  statement {
    sid    = "AllowAllSNSActionsFromSharedAccountSupplier"
    effect = "Allow"
    actions = [
      "SNS:Publish",
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.shared_infra_account_id}:root"
      ]
    }

    resources = [
      aws_sns_topic.sns_topic_supplier.arn,
    ]
  }
}
