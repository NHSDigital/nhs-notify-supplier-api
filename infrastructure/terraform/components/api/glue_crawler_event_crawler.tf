resource "aws_glue_crawler" "event_crawler" {
  count         = local.event_cache_bucket_name != null ? 1 : 0
  name          = "${local.csi}-audit-event-crawler"
  database_name = aws_glue_catalog_database.supplier.name
  role          = aws_iam_role.glue_role.arn

  table_prefix = ""
  s3_target {
    path = "s3://${local.event_cache_bucket_name}/"
  }

  s3_target {
    path = "s3://${local.eventsub_event_cache_bucket_name}/"
  }

  schedule = "cron(0 * * * ? *)"
  recrawl_policy {
    recrawl_behavior = "CRAWL_NEW_FOLDERS_ONLY"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "LOG"
  }

}
