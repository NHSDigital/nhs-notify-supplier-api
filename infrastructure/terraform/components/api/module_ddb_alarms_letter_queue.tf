module "ddb_alarms_suppliers" {
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.letter_queue.name
  tags         = local.default_tags
}
