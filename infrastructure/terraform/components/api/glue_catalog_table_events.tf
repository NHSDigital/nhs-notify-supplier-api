resource "aws_glue_catalog_table" "events" {
  name          = "events_history"
  database_name = aws_glue_catalog_database.supplier.name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    classification = "json"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.event_reporting.bucket}/events/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    columns {
      name = "type"
      type = "string"
    }

    columns {
      name = "messageid"
      type = "string"
    }

    columns {
      name = "topicarn"
      type = "string"
    }

    columns {
      name = "message"
      type = "string"
    }

    columns {
      name = "timestamp"
      type = "string"
    }

    columns {
      name = "unsubscribeurl"
      type = "string"
    }

    columns {
      name = "change"
      type = "double"
    }

    columns {
      name = "price"
      type = "double"
    }

    columns {
      name = "ticker_symbol"
      type = "string"
    }

    columns {
      name = "sector"
      type = "string"
    }

    columns {
      name = "partition_0"
      type = "string"
    }

    columns {
      name = "partition_1"
      type = "string"
    }

    columns {
      name = "partition_2"
      type = "string"
    }

    columns {
      name = "partition_3"
      type = "string"
    }
  }
}
