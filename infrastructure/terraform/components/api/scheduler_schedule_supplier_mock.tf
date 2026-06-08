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
