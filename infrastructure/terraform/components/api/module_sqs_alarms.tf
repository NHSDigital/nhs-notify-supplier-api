module "sqs_alarms" {
  for_each = local.sqs_alarm_targets
  source   = "../../modules/alarms-sqs"

  alarm_prefix   = local.csi
  queue_name     = each.value.name
  dlq_queue_name = replace(each.value.name, "-queue", "-dlq")
  tags           = local.default_tags
}
