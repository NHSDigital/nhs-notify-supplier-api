module "populate_unallocated_breaches" {
  count  = local.eventpub_parquet_enabled ? 1 : 0
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/6.0.5/terraform-lambda.zip"

  function_name = "populate_unallocated_breaches"
  description   = "Populates unallocated breaches for the letter SLA breaches state machine"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.populate_unallocated_breaches_lambda.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "letter-sla-breaches/populate-unallocated-breaches/dist"
  function_include_common = true
  handler_function_name   = "populateUnallocatedBreachesHandler"
  runtime                 = "nodejs22.x"
  memory                  = 128
  timeout                 = 29
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  log_destination_arn       = local.destination_arn
  odin_log_destination_arn  = local.odin_destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = {
    ATHENA_WORKGROUP = aws_athena_workgroup.reporting.name
    ATHENA_DATABASE  = aws_glue_catalog_database.supplier.name
    # The Glue crawler names each table after its S3 bucket, with hyphens replaced by underscores
    SUBSCRIPTION_TABLE_NAME = replace(local.eventsub_event_cache_bucket_name, "-", "_")
    PUBLICATION_TABLE_NAME  = replace(local.event_cache_bucket_name, "-", "_")
    LOG_REFERENCE           = "POP_UNA_BCH"
  }
}

data "aws_iam_policy_document" "populate_unallocated_breaches_lambda" {
  statement {
    sid    = "KMSPermissions"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]

    resources = [
      module.kms.key_arn,
    ]
  }
  statement {
    sid    = "AllowAthenaQueryExecution"
    effect = "Allow"

    actions = [
      "athena:GetQueryExecution",
      "athena:GetQueryResults",
      "athena:StartQueryExecution",
    ]

    resources = [aws_athena_workgroup.reporting.arn]
  }

  statement {
    sid    = "AllowGlueCatalogRead"
    effect = "Allow"

    actions = [
      "glue:GetDatabase",
      "glue:GetPartitions",
      "glue:GetTable",
    ]

    resources = [
      "arn:aws:glue:${var.region}:${var.aws_account_id}:catalog",
      "arn:aws:glue:${var.region}:${var.aws_account_id}:database/${aws_glue_catalog_database.supplier.name}",
      "arn:aws:glue:${var.region}:${var.aws_account_id}:table/${aws_glue_catalog_database.supplier.name}/*",
    ]
  }

  statement {
    sid    = "AllowReadReportingData"
    effect = "Allow"

    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
    ]

    resources = [module.s3bucket_reporting.arn]
  }

  statement {
    sid     = "AllowReadEventData"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${module.s3bucket_reporting.arn}/parquet/*",
      "${module.s3bucket_reporting.arn}/supplier_config_cache/*",
    ]
  }

  statement {
    sid    = "AllowListEventCacheBuckets"
    effect = "Allow"

    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
    ]

    resources = [
      "arn:aws:s3:::${local.event_cache_bucket_name}",
      "arn:aws:s3:::${local.eventsub_event_cache_bucket_name}",
    ]
  }

  statement {
    sid     = "AllowReadEventCacheData"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "arn:aws:s3:::${local.event_cache_bucket_name}/*",
      "arn:aws:s3:::${local.eventsub_event_cache_bucket_name}/*",
    ]
  }

  statement {
    sid    = "AllowAthenaOutput"
    effect = "Allow"

    actions = [
      "s3:AbortMultipartUpload",
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = ["${module.s3bucket_reporting.arn}/athena-output/*"]
  }
}
