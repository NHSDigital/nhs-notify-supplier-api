resource "aws_glue_crawler" "event_crawler" {
  count  = local.event_cache_bucket_name != null ? 1 : 0
  name          = "event-crawler-${aws_glue_catalog_table.events.name}"
  database_name = aws_glue_catalog_database.supplier.name
  role          = aws_iam_role.glue_role.arn

  table_prefix = ""
  s3_target {
    path = "s3://${local.csi_global}-eventcache/"
  }
  recrawl_policy {
    recrawl_behavior = "CRAWL_EVERYTHING"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

}
