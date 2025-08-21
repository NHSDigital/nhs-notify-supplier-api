module "domain_truststore" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket?ref=v2.0.17"

  name           = "${local.csi_s3}-truststore"
  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  default_tags   = merge(local.default_tags, { "Enable-Backup" = var.enable_backups }, { "Enable-S3-Continuous-Backup" = var.enable_backups }, { "SKIP_S3_AUDIT" = "true" })
  kms_key_arn = module.kms.key_id

  bucket_logging_target = {
    bucket = module.logging_bucket.bucket
    prefix = "${name}/"
  }

  policy_documents = [
    aws_iam_policy_document.truststore.json
  ]

}
