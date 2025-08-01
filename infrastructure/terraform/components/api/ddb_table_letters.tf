terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.81.0"
    }
  }
}
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

  tags = var.default_tags
}
