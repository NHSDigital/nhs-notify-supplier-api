module "s3bucket_reporting" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/6.0.6/terraform-s3bucket.zip"

  name = "supapi-reporting"

  aws_account_id = var.aws_account_id
  region         = var.region
  project        = var.project
  environment    = var.environment
  component      = var.component

  kms_key_arn = module.kms.key_arn

  policy_documents = [data.aws_iam_policy_document.s3bucket_reporting.json]

  force_destroy = var.force_destroy

  lifecycle_rules = [
    {
      prefix  = "athena-output"
      enabled = true

      expiration = {
        days = var.reports_data_retention_policy_days
      }

      noncurrent_version_expiration = {
        noncurrent_days = var.reports_data_retention_non_current_days
      }
    },
  ]

  default_tags = {
    NHSE-Enable-S3-Backup-Acct = "True",
  }
}

data "aws_iam_policy_document" "s3bucket_reporting" {
  statement {
    sid    = "AllowManagedAccountsToList"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = [
      module.s3bucket_reporting.arn,
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.aws_account_id}:root"
      ]
    }
  }

  statement {
    sid    = "AllowManagedAccountsToGet"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = [
      "${module.s3bucket_reporting.arn}/*",
    ]

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.aws_account_id}:root"
      ]
    }
  }
}
