resource "aws_iam_role" "eventpub_parquet_firehose" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name               = "${local.csi}-eventpub-parquet-firehose"
  assume_role_policy = data.aws_iam_policy_document.eventpub_parquet_firehose_assume_role.json
}

data "aws_iam_policy_document" "eventpub_parquet_firehose_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["firehose.amazonaws.com"]
    }
  }
}
