resource "aws_athena_workgroup" "letter_sla_breaches" {
  name          = "${local.csi}-letter-sla-breaches"
  description   = "Athena workgroup for the letter SLA breaches state machine"
  force_destroy = var.force_destroy

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${module.s3bucket_athena_query_results.bucket}/letter-sla-breaches/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = module.kms.key_arn
      }
    }
  }
}
