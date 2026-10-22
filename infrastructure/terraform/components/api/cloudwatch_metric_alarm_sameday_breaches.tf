resource "aws_cloudwatch_metric_alarm" "sameday_breaches" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  alarm_name        = "${local.csi}-sameday-breaches"
  alarm_description = "RELIABILITY: Letters have breached the same-day SLA"

  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "q1"
    label       = "Max SamedayBreachCount across all suppliers, clients and campaigns"
    return_data = true
    period      = 3600
    expression  = "SELECT MAX(SamedayBreachCount) FROM SCHEMA(\"${module.populate_sameday_breaches[0].function_name}\", CampaignId, ClientId, SupplierId)"
  }

  actions_enabled           = false
  alarm_actions             = []
  ok_actions                = []
  insufficient_data_actions = []
  tags                      = local.default_tags
}
