data "aws_iam_role" "csoc_subscription" {
  count = var.csoc_log_forwarding ? 1 : 0
  name  = "nhs-main-acct-api-log-subscription-role"
}
