resource "aws_dynamodb_table" "mi" {
  name         = "${local.csi}-mi"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "supplierId"
  range_key = "id"

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "supplierId"
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
