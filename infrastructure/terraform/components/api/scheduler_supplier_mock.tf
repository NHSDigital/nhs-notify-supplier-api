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
