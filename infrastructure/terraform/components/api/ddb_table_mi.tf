resource "aws_dynamodb_table" "mi" {
  name         = "${local.csi}-mi"
  billing_mode = "PAY_PER_REQUEST"
  stream_enabled = true
  stream_view_type = "NEW_IMAGE"

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

  tags = var.default_tags
}
