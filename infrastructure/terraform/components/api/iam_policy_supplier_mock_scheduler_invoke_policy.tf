resource "aws_iam_policy" "supplier_mock_scheduler_invoke_policy" {
  count  = var.deploy_supplier_mock_scheduler ? 1 : 0
  name   = "${local.csi}-supplier-mock-scheduler-invoke"
  policy = data.aws_iam_policy_document.supplier_mock_scheduler_invoke_policy[0].json
}
