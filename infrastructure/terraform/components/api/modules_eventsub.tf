module "eventsub" {
  source = "../../modules/eventsub"

  name = "event-subscriber"

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

  event_cache_buffer_interval        = 500
  enable_sns_delivery_logging        = true
  sns_success_logging_sample_percent = 0

  event_cache_expiry_days = 30
  enable_event_cache      = true
}
