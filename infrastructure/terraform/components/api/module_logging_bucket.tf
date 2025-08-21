module "logging_bucket" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket?ref=v2.0.17"

  name           = "bucket-logs"
  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  default_tags   = local.default_tags
  kms_key_arn = module.kms.key_id

  policy_documents = [
    data.aws_iam_policy_document.logging.json
  ]
}

data "aws_iam_policy_document" "logging" {
  statement {
      sid    = "s3-log-delivery"
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["logging.s3.amazonaws.com"]
      }

      actions = ["s3:PutObject"]

      resources = [
        "${module.logging_bucket.arn}/*",
      ]
    }
}
