module "eventsub" {
  source = "../../modules/eventsub"

  name = "eventsub"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  default_tags = local.default_tags

  glue_role_arn = aws_iam_role.glue_role.arn

  kms_key_arn           = module.kms.key_arn
  log_retention_in_days = var.log_retention_in_days
  log_level             = "INFO"
  force_destroy         = var.force_destroy

  event_cache_buffer_interval        = 500
  enable_sns_delivery_logging        = var.enable_sns_delivery_logging
  sns_success_logging_sample_percent = var.sns_success_logging_sample_percent

  event_cache_expiry_days = 30
  enable_event_cache      = var.enable_event_cache

  shared_infra_account_id = var.shared_infra_account_id
}
