resource "aws_scheduler_schedule" "letter_sla_breaches" {
  name                         = "${local.csi}-letter-sla-breaches"
  description                  = "Daily trigger for the letter SLA breaches state machine"
  state                        = "DISABLED"
  schedule_expression          = "cron(0 7 * * ? *)"
  schedule_expression_timezone = "Europe/London"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_sfn_state_machine.letter_sla_breaches.arn
    role_arn = aws_iam_role.letter_sla_breaches_scheduler.arn
    input    = "{}"
  }
}
