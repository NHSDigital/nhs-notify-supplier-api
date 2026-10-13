<!-- vale off -->

# EventPub Parquet Transformer Lambda

## Purpose

Firehose data-transformation processor for the EventPub parquet delivery stream. Flattens each CloudEvent so Firehose can convert it to Parquet for Athena.

## General Flow

1. Firehose invokes the Lambda with a batch of base64 encoded CloudEvents.
2. Each event is parsed and returned as a flat JSON record: the envelope attributes, the raw `data` payload as `data_json`, and the promoted `domainid`, `supplierid`, `groupid`, `campaignid` and `clientid` properties.
3. Records that are not valid JSON objects are returned as `ProcessingFailed` and are written to the stream's error prefix.

## Key Integration Points

- **Kinesis Data Firehose**: the `eventpub-parquet` delivery stream.
