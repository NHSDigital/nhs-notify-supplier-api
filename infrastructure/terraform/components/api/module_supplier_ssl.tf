module "supplier_ssl" {
  count = var.manually_configure_mtls_truststore ? 0 : 1

  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/ssl?ref=v2.0.17"

  name           = "sapi_trust"
  aws_account_id = var.aws_account_id
  default_tags   = local.default_tags
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  subject_common_name = local.root_domain_name
}
