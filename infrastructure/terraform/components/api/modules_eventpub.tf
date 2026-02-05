module "eventpub" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.31/terraform-eventpub.zip"

  name = "eventpub"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  default_tags = local.default_tags

  kms_key_arn           = module.kms.key_arn
  log_retention_in_days = var.log_retention_in_days
  log_level             = "INFO"

  force_destroy = var.force_destroy

  event_cache_buffer_interval        = 500
  enable_sns_delivery_logging        = var.enable_sns_delivery_logging
  sns_success_logging_sample_percent = var.sns_success_logging_sample_percent

  event_cache_expiry_days = 30
  enable_event_cache      = var.enable_event_cache

  data_plane_bus_arn    = var.eventpub_data_plane_bus_arn
  control_plane_bus_arn = var.eventpub_control_plane_bus_arn

  additional_policies_for_event_cache_bucket = [
    data.aws_iam_policy_document.eventcache[0].json
  ]
}
data "aws_iam_policy_document" "eventcache" {
  count = local.event_cache_bucket_name != null ? 1 : 0
  statement {
    sid    = "AllowGlueListBucketAndGetLocation"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.glue_role.arn]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation"
    ]

    resources = [
      "arn:aws:s3:::${local.csi_global}-eventcache"
    ]
  }

  # Object-level permissions: Get/Put/Delete objects
  statement {
    sid    = "AllowGlueObjectAccess"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.glue_role.arn]
    }

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      "arn:aws:s3:::${local.csi_global}-eventcache/*"
    ]
  }
}
