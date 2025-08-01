resource "aws_dynamodb_table" "letters" {
  name         = "${local.csi}-letters"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "supplierId"
  range_key = "id"

  global_secondary_index {
    name            = "supplierStatus-index"
    hash_key        = "supplierStatus"
    range_key       = "id"
    projection_type = "ALL"
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
    name = "supplierStatus"
    type = "string"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.default_tags
}
