resource "aws_iam_role_policy_attachment" "supplier_mock_scheduler_invoke_policy" {
  count      = var.deploy_supplier_mock_scheduler ? 1 : 0
  role       = aws_iam_role.supplier_mock_scheduler[0].name
  policy_arn = aws_iam_policy.supplier_mock_scheduler_invoke_policy[0].arn
}
