module "supplier_ssl" {
  count = var.manually_configure_mtls_truststore ? 0 : 1

  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.25/terraform-ssl.zip"

  name                = "sapi_trust"
  aws_account_id      = var.aws_account_id
  default_tags        = local.default_tags
  component           = var.component
  environment         = var.environment
  project             = var.project
  region              = var.region
  subject_common_name = local.root_domain_name
}
