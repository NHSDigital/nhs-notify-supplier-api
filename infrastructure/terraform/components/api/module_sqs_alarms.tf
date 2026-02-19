module "sqs_alarms" {
  for_each = local.sqs_queue_names
  source   = "../../modules/alarms/alarms-sqs"

  alarm_prefix       = local.csi
  queue_name         = each.value.name
  dlq_queue_name     = replace(each.value.name, "-queue", "-dlq")
  age_period_seconds = each.value.age_period_seconds
  tags               = local.default_tags
}
