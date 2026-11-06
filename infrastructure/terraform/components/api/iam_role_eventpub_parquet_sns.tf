resource "aws_iam_role" "eventpub_parquet_sns" {
  count = local.eventpub_parquet_enabled ? 1 : 0

  name               = "${local.csi}-eventpub-parquet-sns"
  assume_role_policy = data.aws_iam_policy_document.eventpub_parquet_sns_assume_role.json
}

data "aws_iam_policy_document" "eventpub_parquet_sns_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }
  }
}
