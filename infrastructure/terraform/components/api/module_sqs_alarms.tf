module "sqs_alarms" {
  for_each = local.alarms_enabled ? local.sqs_alarm_targets : {}
  source   = "../../modules/alarms-sqs"

  alarm_prefix   = local.csi
  queue_name     = each.value
  tags           = local.default_tags
}
