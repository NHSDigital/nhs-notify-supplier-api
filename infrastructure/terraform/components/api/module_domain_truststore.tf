module "domain_truststore" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/3.0.4/terraform-s3bucket.zip"

  name           = "truststore"
  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  default_tags = local.default_tags
  kms_key_arn  = module.kms.key_id

  bucket_logging_target = {
    bucket = local.acct.s3_buckets["access_logs"]["id"]
  }

  policy_documents = [
  ]
}
