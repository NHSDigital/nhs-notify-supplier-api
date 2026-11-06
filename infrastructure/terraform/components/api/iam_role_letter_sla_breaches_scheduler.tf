resource "aws_iam_role" "letter_sla_breaches_scheduler" {
  count              = local.eventpub_parquet_enabled ? 1 : 0
  name               = "${local.csi}-letter-sla-breaches-scheduler"
  description        = "Allows EventBridge Scheduler to start the letter SLA breaches state machine"
  assume_role_policy = data.aws_iam_policy_document.letter_sla_breaches_scheduler_trust_policy.json
}

data "aws_iam_policy_document" "letter_sla_breaches_scheduler_trust_policy" {
  statement {
    sid     = "AllowSchedulerAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.aws_account_id]
    }
  }
}

resource "aws_iam_role_policy" "letter_sla_breaches_scheduler" {
  count  = local.eventpub_parquet_enabled ? 1 : 0
  name   = "${local.csi}-letter-sla-breaches-scheduler"
  role   = aws_iam_role.letter_sla_breaches_scheduler[0].id
  policy = data.aws_iam_policy_document.letter_sla_breaches_scheduler[0].json
}

data "aws_iam_policy_document" "letter_sla_breaches_scheduler" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  statement {
    sid       = "AllowStartLetterSlaBreachesExecution"
    effect    = "Allow"
    actions   = ["states:StartExecution"]
    resources = [aws_sfn_state_machine.letter_sla_breaches[0].arn]
  }
}
