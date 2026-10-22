resource "aws_scheduler_schedule" "letter_sla_breaches" {
  count       = local.eventpub_parquet_enabled ? 1 : 0
  name        = "${local.csi}-letter-sla-breaches"
  description = "Hourly trigger for the letter SLA breaches state machine"
  state       = var.enable_letter_sla_breaches_scheduler ? "ENABLED" : "DISABLED"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression = "rate(1 hour)"

  target {
    arn      = aws_sfn_state_machine.letter_sla_breaches[0].arn
    role_arn = aws_iam_role.letter_sla_breaches_scheduler[0].arn
    input    = jsonencode({})
  }
}
