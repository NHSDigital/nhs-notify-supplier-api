resource "aws_iam_role_policy" "letter_sla_breaches" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name   = "${local.csi}-letter-sla-breaches-sfn"
  role   = aws_iam_role.letter_sla_breaches[0].id
  policy = data.aws_iam_policy_document.letter_sla_breaches_policy[0].json
}

data "aws_iam_policy_document" "letter_sla_breaches_policy" {
  count = local.eventpub_parquet_enabled ? 1 : 0

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
      module.populate_sameday_breaches[0].function_arn,
      module.populate_standard_breaches[0].function_arn,
    ]
  }
}
