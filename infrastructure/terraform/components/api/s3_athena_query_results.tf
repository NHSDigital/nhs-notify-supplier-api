module "s3bucket_athena_query_results" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/3.0.6/terraform-s3bucket.zip"

  name = "athena-query-results"

  aws_account_id = var.aws_account_id
  region         = var.region
  project        = var.project
  environment    = var.environment
  component      = var.component

  acl           = "private"
  force_destroy = var.force_destroy
  versioning    = false
  kms_key_arn   = module.kms.key_arn

  lifecycle_rules = [
    {
      enabled = true

      expiration = {
        days = "7"
      }

      abort_incomplete_multipart_upload = {
        days = "1"
      }
    }
  ]

  policy_documents = [
    data.aws_iam_policy_document.s3bucket_athena_query_results.json
  ]

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
    Name = "Athena Query Results"
  }
}

data "aws_iam_policy_document" "s3bucket_athena_query_results" {
  statement {
    sid     = "DontAllowNonSecureConnection"
    effect  = "Deny"
    actions = ["s3:*"]

    resources = [
      module.s3bucket_athena_query_results.arn,
      "${module.s3bucket_athena_query_results.arn}/*",
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}
