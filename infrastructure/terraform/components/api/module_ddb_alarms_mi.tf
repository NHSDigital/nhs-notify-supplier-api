module "ddb_alarms_mi" {
  source       = "../../modules/alarms/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.mi.name
  tags         = local.default_tags
}
