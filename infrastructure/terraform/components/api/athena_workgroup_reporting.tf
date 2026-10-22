resource "aws_athena_workgroup" "reporting" {
  name          = local.csi
  description   = "Supplier API Athena Workgroup for ${var.environment}"
  force_destroy = true

  configuration {
    enforce_workgroup_configuration = true

    result_configuration {
      expected_bucket_owner = var.aws_account_id
      output_location       = "s3://${module.s3bucket_reporting.bucket}/athena-output/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = module.kms.key_arn
      }
    }
  }
}
