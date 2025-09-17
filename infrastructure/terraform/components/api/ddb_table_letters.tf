resource "aws_dynamodb_table" "letters" {
  name         = "${local.csi}-letters"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "supplierId"
  range_key = "id"

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "supplierStatus-index"
    hash_key        = "supplierStatus"
    range_key       = "supplierStatusSk"
    projection_type = "ALL"
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "supplierId"
    type = "S"
  }

  attribute {
    name = "supplierStatus"
    type = "S"
  }

  attribute {
    name = "supplierStatusSk"
    type = "S"
  }

  attribute {
    name = "reasonCode"
    type = "N"
  }

    attribute {
    name = "reasonText"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.default_tags
}
