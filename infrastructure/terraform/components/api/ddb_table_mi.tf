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
    type = "string"
  }

  attribute {
    name = "supplierId"
    type = "string"
  }

  attribute {
    name = "ttl"
    type = "number"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.default_tags
}
