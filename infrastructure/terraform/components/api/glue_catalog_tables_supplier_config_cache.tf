locals {
  supplier_config_cache_table_columns = {
    supplier = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "channelType", type = "string" },
      { name = "dailyCapacity", type = "bigint" },
      { name = "id", type = "string" },
      { name = "name", type = "string" },
      { name = "status", type = "string" },
    ]
    volume-group = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "description", type = "string" },
      { name = "endDate", type = "string" },
      { name = "id", type = "string" },
      { name = "name", type = "string" },
      { name = "startDate", type = "string" },
      { name = "status", type = "string" },
    ]
    supplier-pack = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "approval", type = "string" },
      { name = "id", type = "string" },
      { name = "packSpecificationId", type = "string" },
      { name = "status", type = "string" },
      { name = "supplierId", type = "string" },
    ]
    letter-variant = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "campaignIds", type = "array<string>" },
      { name = "clientId", type = "string" },
      { name = "constraints", type = "struct<blackCoveragePercentage:struct<operator:string,value:double>,colourCoveragePercentage:struct<operator:string,value:double>,deliveryDays:struct<operator:string,value:double>,sheets:struct<operator:string,value:double>,sides:struct<operator:string,value:double>>" },
      { name = "description", type = "string" },
      { name = "id", type = "string" },
      { name = "name", type = "string" },
      { name = "packSpecificationIds", type = "array<string>" },
      { name = "priority", type = "bigint" },
      { name = "status", type = "string" },
      { name = "supplierId", type = "string" },
      { name = "type", type = "string" },
      { name = "volumeGroupId", type = "string" },
    ]
    pack-specification = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "assembly", type = "struct<duplex:boolean,envelopeId:string,features:array<string>,insertIds:array<string>,paper:struct<colour:string,id:string,name:string,recycled:boolean,size:string,weightGSM:double>,printColour:string>" },
      { name = "billingId", type = "string" },
      { name = "constraints", type = "struct<blackCoveragePercentage:struct<operator:string,value:double>,colourCoveragePercentage:struct<operator:string,value:double>,deliveryDays:struct<operator:string,value:double>,sheets:struct<operator:string,value:double>,sides:struct<operator:string,value:double>>" },
      { name = "createdAt", type = "string" },
      { name = "description", type = "string" },
      { name = "id", type = "string" },
      { name = "name", type = "string" },
      { name = "postage", type = "struct<deliveryDays:double,id:string,maxThicknessMm:double,maxWeightGrams:double,size:string>" },
      { name = "status", type = "string" },
      { name = "updatedAt", type = "string" },
      { name = "version", type = "bigint" },
    ]
    supplier-allocation = [
      { name = "pk", type = "string" },
      { name = "sk", type = "string" },
      { name = "allocationPercentage", type = "double" },
      { name = "id", type = "string" },
      { name = "status", type = "string" },
      { name = "supplier", type = "string" },
      { name = "volumeGroup", type = "string" },
    ]
  }
}

resource "aws_glue_catalog_table" "supplier_config_cache" {
  for_each      = local.eventsub_event_cache_bucket_name != null ? local.supplier_config_cache_table_columns : {}
  name          = "${replace(local.csi, "-", "_")}_${replace(each.key, "-", "_")}"
  database_name = aws_glue_catalog_database.supplier.name
  table_type    = "EXTERNAL_TABLE"

  parameters = {
    EXTERNAL       = "TRUE"
    classification = "json"
  }

  storage_descriptor {
    location      = "s3://${local.eventsub_event_cache_bucket_name}/supplier_config_cache/${each.key}/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "OpenXJsonSerDe"
      serialization_library = "org.openx.data.jsonserde.JsonSerDe"

      parameters = {
        "case.insensitive" = "false"
      }
    }

    dynamic "columns" {
      for_each = each.value

      content {
        name = columns.value.name
        type = columns.value.type
      }
    }
  }
}
