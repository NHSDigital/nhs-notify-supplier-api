output "sns_topic_event_bus" {
  description = "SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.sns_topic_event_bus.arn
    name = aws_sns_topic.sns_topic_event_bus.name
  }
}

output "sns_topic_supplier" {
  description = "SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.sns_topic_supplier.arn
    name = aws_sns_topic.sns_topic_supplier.name
  }
}

output "s3_bucket_event_cache" {
  description = "S3 Bucket ARN and Name for event cache"
  value = var.enable_event_cache ? {
    arn    = module.s3bucket_event_cache[0].arn
    bucket = module.s3bucket_event_cache[0].bucket
  } : {}
}
