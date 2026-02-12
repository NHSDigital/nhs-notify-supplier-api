resource "aws_glue_catalog_database" "supplier" {
  name        = "${local.csi}-supplier"
  description = "Glue catalog database for Suppliers API"
}
