resource "aws_iam_role_policy" "letter_sla_breaches" {
  name   = "${local.csi}-letter-sla-breaches-sfn"
  role   = aws_iam_role.letter_sla_breaches.id
  policy = data.aws_iam_policy_document.letter_sla_breaches_policy.json
}

data "aws_iam_policy_document" "letter_sla_breaches_policy" {
  statement {
    sid       = "AllowListOwnExecutions"
    effect    = "Allow"
    actions   = ["states:ListExecutions"]
    resources = [local.letter_sla_breaches_state_machine_arn]
  }

  statement {
    sid     = "AllowInvokeLambdas"
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      module.populate_supplier_config_cache.function_arn,
      module.populate_sameday_breaches.function_arn,
      module.populate_standard_breaches.function_arn,
    ]
  }
}
