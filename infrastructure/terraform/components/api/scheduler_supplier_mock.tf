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
  count              = var.deploy_supplier_mock_scheduler ? 1 : 0
}

data "aws_iam_policy_document" "supplier_mock_scheduler_invoke_policy" {
  count = var.deploy_supplier_mock_scheduler ? 1 : 0

  statement {
    sid    = "AllowInvokeSupplierMockLambda"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction",
    ]

    resources = [
      module.supplier_mock[0].function_arn,
    ]
  }
}

resource "aws_iam_policy" "supplier_mock_scheduler_invoke_policy" {
  count  = var.deploy_supplier_mock_scheduler ? 1 : 0
  name   = "${local.csi}-supplier-mock-scheduler-invoke"
  policy = data.aws_iam_policy_document.supplier_mock_scheduler_invoke_policy[0].json
}

resource "aws_iam_role_policy_attachment" "supplier_mock_scheduler_invoke_policy" {
  count      = var.deploy_supplier_mock_scheduler ? 1 : 0
  role       = aws_iam_role.supplier_mock_scheduler[0].name
  policy_arn = aws_iam_policy.supplier_mock_scheduler_invoke_policy[0].arn
}

resource "aws_scheduler_schedule" "supplier_mock" {
  count       = var.deploy_supplier_mock_scheduler ? 1 : 0
  name        = "${local.csi}-supplier-mock"
  description = "Scheduled trigger for supplier mock lambda"
  state       = var.enable_supplier_mock_scheduler ? "ENABLED" : "DISABLED"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = var.supplier_mock_schedule_expression

  target {
    arn      = module.supplier_mock[0].function_arn
    role_arn = aws_iam_role.supplier_mock_scheduler[0].arn
    input = jsonencode({
      source = "eventbridge-scheduler"
    })
  }
}
