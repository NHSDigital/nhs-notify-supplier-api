resource "aws_dynamodb_table" "upsert_idempotency" {
  name         = "${local.csi}-upsert-idempotency"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  ttl {
    attribute_name = "expiration"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    local.default_tags,
    {
      NHSE-Enable-Dynamo-Backup-Acct = "True"
    }
  )
}
