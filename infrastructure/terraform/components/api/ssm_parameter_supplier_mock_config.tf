resource "aws_ssm_parameter" "supplier_mock_config" {
  count       = var.deploy_supplier_mock_scheduler ? 1 : 0
  name        = format("/nhs/supapi/%s/supplier-mock/config", var.environment)
  description = "JSON object containing supplier mock config for supplierID, getLetters limit, specificationId mapping, etc."
  type        = "String"
  value = jsonencode({
    limit       = "100"
    supplier_id = "TestSupplier1"
    specification_id_mapping = {
      "test-specification-id-1" = "ACCEPTED"
    }
  })

  lifecycle {
    ignore_changes = [value]
  }
}
