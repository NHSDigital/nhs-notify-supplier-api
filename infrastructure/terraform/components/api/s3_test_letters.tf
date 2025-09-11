module "s3bucket_test_letters" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket?ref=v2.0.20"

  name = "test-letters"

  aws_account_id = var.aws_account_id
  region         = "eu-west-2"
  project        = var.project
  environment    = var.environment
  component      = var.component

  acl           = "private"
  force_destroy = var.force_destroy
  versioning    = false

  bucket_logging_target = {
    bucket = local.acct.s3_buckets["access_logs"]["id"]
  }

  public_access = {
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }

  default_tags = {
    Name = "Supplier API Test Letters"
  }
}
