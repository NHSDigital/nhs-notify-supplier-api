resource "aws_dynamodb_table" "supplier-configuration" {
  name         = "${local.csi}-supplier-config"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "entityType"
    type = "S"
  }
  // The type-index GSI allows us to query for all supplier configurations of a given type (e.g. all letter supplier configurations)
  global_secondary_index {
    name            = "EntityTypeIndex"
    hash_key        = "entityType"
    range_key       = "SK"
    projection_type = "ALL"
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
