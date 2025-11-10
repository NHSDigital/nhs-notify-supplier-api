module "domain_truststore" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.25/terraform-s3bucket.zip"

  name           = "truststore"
  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  default_tags = local.default_tags
  kms_key_arn  = module.kms.key_id

  bucket_logging_target = {
    bucket = module.logging_bucket.bucket
    prefix = "truststore/"
  }

  policy_documents = [
  ]

}
