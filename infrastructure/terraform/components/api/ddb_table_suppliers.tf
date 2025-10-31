resource "aws_dynamodb_table" "suppliers" {
  name         = "${local.csi}-suppliers"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "id"
  range_key = "apimId"

  ttl {
    attribute_name = "ttl"
    enabled        = false
  }

  global_secondary_index {
    name            = "supplier-apim-index"
    hash_key        = "apimId"
    projection_type = "ALL"
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "apimId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.default_tags
}
