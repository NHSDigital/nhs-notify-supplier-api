resource "aws_iam_role" "letter_sla_breaches" {
  name               = "${local.csi}-letter-sla-breaches-sfn"
  description        = "Execution role for the letter SLA breaches state machine"
  assume_role_policy = data.aws_iam_policy_document.letter_sla_breaches_trust_policy.json
}

data "aws_iam_policy_document" "letter_sla_breaches_trust_policy" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}
