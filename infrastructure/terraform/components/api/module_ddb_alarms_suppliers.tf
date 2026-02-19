module "ddb_alarms_suppliers" {
  source       = "../../modules/alarms/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.suppliers.name
  tags         = local.default_tags
}
