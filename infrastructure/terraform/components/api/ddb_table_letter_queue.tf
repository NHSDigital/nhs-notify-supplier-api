resource "aws_dynamodb_table" "letter-queue" {
  name         = "${local.csi}-letter-queue"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "supplierId"
  range_key = "queueTimestamp"

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  local_secondary_index {
    name            = "timestamp-index"
    range_key       = "letterId"
    projection_type = "ALL"
  }

  attribute {
    name = "supplierId"
    type = "S"
  }

  attribute {
    name = "letterId"
    type = "S"
  }

  attribute {
    name = "queueTimestamp"
    type = "S"
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
