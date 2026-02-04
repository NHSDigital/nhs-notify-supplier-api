# Moved blocks to handle resource renames without destroy/recreate

moved {
  from = aws_sns_topic.main
  to   = aws_sns_topic.eventsub_topic
}

moved {
  from = aws_sns_topic_policy.main
  to   = aws_sns_topic_policy.eventsub_topic
}
