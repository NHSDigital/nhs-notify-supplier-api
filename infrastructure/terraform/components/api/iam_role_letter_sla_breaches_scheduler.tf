data "aws_iam_policy_document" "letter_sla_breaches_scheduler_trust_policy" {
  statement {
    sid     = "AllowSchedulerAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "letter_sla_breaches_scheduler" {
  name               = "${local.csi}-letter-sla-breaches-scheduler"
  description        = "Allows EventBridge Scheduler to start the letter SLA breaches state machine"
  assume_role_policy = data.aws_iam_policy_document.letter_sla_breaches_scheduler_trust_policy.json
}

data "aws_iam_policy_document" "letter_sla_breaches_scheduler_start_policy" {
  statement {
    sid       = "AllowStartLetterSlaBreachesStateMachine"
    effect    = "Allow"
    actions   = ["states:StartExecution"]
    resources = [local.letter_sla_breaches_state_machine_arn]
  }
}

resource "aws_iam_role_policy" "letter_sla_breaches_scheduler_start_policy" {
  name   = "${local.csi}-letter-sla-breaches-scheduler-start"
  role   = aws_iam_role.letter_sla_breaches_scheduler.id
  policy = data.aws_iam_policy_document.letter_sla_breaches_scheduler_start_policy.json
}
