module "ddb_alarms_letter_queue" {
  count        = local.alarms_enabled ? 1 : 0
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.letter_queue.name
  tags         = local.default_tags
}
