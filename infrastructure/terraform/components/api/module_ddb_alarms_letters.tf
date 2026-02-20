module "ddb_alarms_letters" {
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.letters.name
  tags         = local.default_tags
}
