resource "aws_iam_role" "supplier_mock_scheduler" {
  name               = "${local.csi}-supplier-mock-scheduler"
  description        = "Allows EventBridge Scheduler to invoke supplier mock lambda"
  assume_role_policy = data.aws_iam_policy_document.supplier_mock_scheduler_trust_policy.json
  count              = var.deploy_supplier_mock_scheduler ? 1 : 0
}
