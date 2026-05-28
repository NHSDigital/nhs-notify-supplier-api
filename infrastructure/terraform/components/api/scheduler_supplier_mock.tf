data "aws_iam_policy_document" "supplier_mock_scheduler_trust_policy" {
  statement {
    sid    = "AllowSchedulerAssumeRole"
    effect = "Allow"

    actions = [
      "sts:AssumeRole",
    ]

    principals {
      type = "Service"

      identifiers = [
        "scheduler.amazonaws.com",
      ]
    }
  }
}

resource "aws_iam_role" "supplier_mock_scheduler" {
  name               = "${local.csi}-supplier-mock-scheduler"
  description        = "Allows EventBridge Scheduler to invoke supplier mock lambda"
  assume_role_policy = data.aws_iam_policy_document.supplier_mock_scheduler_trust_policy.json
}

data "aws_iam_policy_document" "supplier_mock_scheduler_invoke_policy" {
  statement {
    sid    = "AllowInvokeSupplierMockLambda"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction",
    ]

    resources = [
      module.supplier_mock.function_arn,
    ]
  }
}

resource "aws_iam_policy" "supplier_mock_scheduler_invoke_policy" {
  name   = "${local.csi}-supplier-mock-scheduler-invoke"
  policy = data.aws_iam_policy_document.supplier_mock_scheduler_invoke_policy.json
}

resource "aws_iam_role_policy_attachment" "supplier_mock_scheduler_invoke_policy" {
  role       = aws_iam_role.supplier_mock_scheduler.name
  policy_arn = aws_iam_policy.supplier_mock_scheduler_invoke_policy.arn
}

resource "aws_scheduler_schedule" "supplier_mock" {
  name        = "${local.csi}-supplier-mock"
  description = "Scheduled trigger for supplier mock lambda"
  state       = var.enable_supplier_mock_scheduler ? "ENABLED" : "DISABLED"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = var.supplier_mock_schedule_expression

  target {
    arn      = module.supplier_mock.function_arn
    role_arn = aws_iam_role.supplier_mock_scheduler.arn
    input = jsonencode({
      source = "eventbridge-scheduler"
    })
  }
}
