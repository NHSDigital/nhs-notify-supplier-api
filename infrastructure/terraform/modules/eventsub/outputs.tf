output "eventsub_topic" {
  description = "SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.eventsub_topic.arn
    name = aws_sns_topic.eventsub_topic.name
  }
}

output "amendments_topic" {
  description = "Amendments SNS Topic ARN and Name"
  value = {
    arn  = aws_sns_topic.amendments_topic.arn
    name = aws_sns_topic.amendments_topic.name
  }
}

output "s3_bucket_event_cache" {
  description = "S3 Bucket ARN and Name for event cache"
  value = var.enable_event_cache ? {
    arn    = module.s3bucket_event_cache[0].arn
    bucket = module.s3bucket_event_cache[0].bucket
  } : {}
}
