module "ddb_alarms_upsert_idempotency" {
  count        = local.alarms_enabled ? 1 : 0
  source       = "../../modules/alarms-ddb"
  alarm_prefix = local.csi
  table_name   = aws_dynamodb_table.upsert_idempotency.name
  tags         = local.default_tags
}
