locals {
  eventpub_parquet_enabled = local.event_cache_bucket_name != null

  # Column names must be lowercase; OpenXJsonSerDe matches JSON keys case-insensitively.
  eventpub_parquet_table_columns = [
    { name = "specversion", type = "string" },
    { name = "id", type = "string" },
    { name = "type", type = "string" },
    { name = "plane", type = "string" },
    { name = "dataschema", type = "string" },
    { name = "dataschemaversion", type = "string" },
    { name = "source", type = "string" },
    { name = "subject", type = "string" },
    { name = "time", type = "string" },
    { name = "recordedtime", type = "string" },
    { name = "datacontenttype", type = "string" },
    { name = "traceparent", type = "string" },
    { name = "tracestate", type = "string" },
    { name = "partitionkey", type = "string" },
    { name = "sampledrate", type = "bigint" },
    { name = "sequence", type = "string" },
    { name = "severitytext", type = "string" },
    { name = "data_json", type = "string" },
    { name = "domainid", type = "string" },
    { name = "supplierid", type = "string" },
    { name = "groupid", type = "string" },
    { name = "campaignid", type = "string" },
    { name = "clientid", type = "string" },
  ]
}

resource "aws_glue_catalog_table" "eventpub_parquet" {
  count         = local.eventpub_parquet_enabled ? 1 : 0
  name          = "${replace(local.csi, "-", "_")}_eventpub"
  database_name = aws_glue_catalog_database.supplier.name
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL           = "TRUE"
    classification     = "parquet"
    "parquet.compress" = "SNAPPY"

    # Athena derives partitions from these properties, so none are registered in Glue
    "projection.enabled"        = "true"
    "projection.__year.type"    = "integer"
    "projection.__year.range"   = "2025,2050"
    "projection.__year.digits"  = "4"
    "projection.__month.type"   = "integer"
    "projection.__month.range"  = "1,12"
    "projection.__month.digits" = "2"
    "projection.__day.type"     = "integer"
    "projection.__day.range"    = "1,31"
    "projection.__day.digits"   = "2"
    "storage.location.template" = "s3://${module.s3bucket_reporting.bucket}/parquet/eventpub/__year=$${__year}/__month=$${__month}/__day=$${__day}/"
  }

  storage_descriptor {
    location      = "s3://${module.s3bucket_reporting.bucket}/parquet/eventpub/"
    input_format  = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat"

    ser_de_info {
      name                  = "ParquetHiveSerDe"
      serialization_library = "org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe"
    }

    dynamic "columns" {
      for_each = local.eventpub_parquet_table_columns

      content {
        name = columns.value.name
        type = columns.value.type
      }
    }
  }

  partition_keys {
    name = "__year"
    type = "string"
  }

  partition_keys {
    name = "__month"
    type = "string"
  }

  partition_keys {
    name = "__day"
    type = "string"
  }
}
