resource "aws_sfn_state_machine" "letter_sla_breaches" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name     = local.letter_sla_breaches_state_machine_name
  role_arn = aws_iam_role.letter_sla_breaches[0].arn

  definition = templatefile("${path.module}/resources/letter_sla_breaches.json", {
    STATE_MACHINE_ARN                           = local.letter_sla_breaches_state_machine_arn
    POPULATE_SUPPLIER_CONFIG_CACHE_FUNCTION_ARN = module.populate_supplier_config_cache.function_arn
    POPULATE_SAMEDAY_BREACHES_FUNCTION_ARN      = module.populate_sameday_breaches[0].function_arn
    POPULATE_STANDARD_BREACHES_FUNCTION_ARN     = module.populate_standard_breaches[0].function_arn
  })
}
