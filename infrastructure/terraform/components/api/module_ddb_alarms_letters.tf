module "ddb_alarms_letters" {
  count        = local.alarms_enabled ? 1 : 0
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.letters.name
  tags         = local.default_tags
}
