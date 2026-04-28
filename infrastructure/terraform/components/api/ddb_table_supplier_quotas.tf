resource "aws_dynamodb_table" "supplier-quotas" {
  name         = "${local.csi}-supplier-quotas"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "pk"
  range_key = "sk"

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
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
