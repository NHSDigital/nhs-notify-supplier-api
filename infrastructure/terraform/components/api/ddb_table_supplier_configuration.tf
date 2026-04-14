resource "aws_dynamodb_table" "supplier-configuration" {
  name         = "${local.csi}-supplier-config"
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

  attribute {
    name = "entityType"
    type = "S"
  }

  attribute {
    name = "volumeGroup"
    type = "S"
  }

  attribute {
    name = "packSpecificationId"
    type = "S"
  }

  // The type-index GSI allows us to query for all supplier configurations of a given type (e.g. all letter supplier configurations)
  global_secondary_index {
    name            = "EntityTypeIndex"
    hash_key        = "entityType"
    range_key       = "sk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "volumeGroup-index"
    hash_key        = "pk"
    range_key       = "volumeGroup"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "packSpecificationId-index"
    hash_key        = "pk"
    range_key       = "packSpecificationId"
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
