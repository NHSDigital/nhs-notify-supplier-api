resource "aws_kinesis_firehose_delivery_stream" "eventpub_parquet" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name        = "${local.csi}-eventpub-parquet"
  destination = "extended_s3"

  server_side_encryption {
    enabled  = true
    key_type = "CUSTOMER_MANAGED_CMK"
    key_arn  = module.kms.key_arn
  }

  extended_s3_configuration {
    role_arn   = aws_iam_role.eventpub_parquet_firehose[0].arn
    bucket_arn = module.s3bucket_reporting.arn

    prefix              = "parquet/eventpub/__year=!{timestamp:yyyy}/__month=!{timestamp:MM}/__day=!{timestamp:dd}/"
    error_output_prefix = "parquet/errors/eventpub/!{firehose:error-output-type}/!{timestamp:yyyy}-!{timestamp:MM}-!{timestamp:dd}/"

    buffering_size     = 128
    buffering_interval = 300

    processing_configuration {
      enabled = true

      processors {
        type = "Lambda"

        parameters {
          parameter_name  = "LambdaArn"
          parameter_value = "${module.eventpub_parquet_transformer.function_arn}:$LATEST"
        }
        parameters {
          parameter_name  = "RoleArn"
          parameter_value = aws_iam_role.eventpub_parquet_firehose[0].arn
        }
      }
    }

    data_format_conversion_configuration {
      input_format_configuration {
        deserializer {
          open_x_json_ser_de {}
        }
      }

      output_format_configuration {
        serializer {
          parquet_ser_de {}
        }
      }

      schema_configuration {
        database_name = aws_glue_catalog_database.supplier.name
        role_arn      = aws_iam_role.eventpub_parquet_firehose[0].arn
        table_name    = aws_glue_catalog_table.eventpub_parquet[0].name
      }
    }

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.eventpub_parquet_firehose[0].name
      log_stream_name = aws_cloudwatch_log_stream.eventpub_parquet_firehose[0].name
    }
  }
}
