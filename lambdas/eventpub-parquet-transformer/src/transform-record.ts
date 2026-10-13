import type {
  FirehoseRecordTransformationStatus,
  FirehoseTransformationResultRecord,
} from "aws-lambda";

const ENVELOPE_FIELDS = [
  "specversion",
  "id",
  "type",
  "plane",
  "dataschema",
  "dataschemaversion",
  "source",
  "subject",
  "time",
  "recordedtime",
  "datacontenttype",
  "traceparent",
  "tracestate",
  "partitionkey",
  "sampledrate",
  "sequence",
  "severitytext",
] as const;

const PROMOTED_DATA_FIELDS = [
  "domainId",
  "supplierId",
  "groupId",
  "campaignId",
  "clientId",
] as const;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flatten(event: Json): Json {
  const data = isObject(event.data) ? event.data : {};

  const flat: Json = {};
  for (const field of ENVELOPE_FIELDS) {
    flat[field] = event[field];
  }
  flat.data_json = JSON.stringify(event.data ?? null);
  for (const field of PROMOTED_DATA_FIELDS) {
    flat[field.toLowerCase()] = data[field];
  }
  return flat;
}

function result(
  recordId: string,
  status: FirehoseRecordTransformationStatus,
  data: string,
): FirehoseTransformationResultRecord {
  return { recordId, result: status, data };
}

export default function transformRecord(record: {
  recordId: string;
  data: string;
}): FirehoseTransformationResultRecord {
  try {
    const event: unknown = JSON.parse(
      Buffer.from(record.data, "base64").toString("utf8"),
    );
    if (!isObject(event)) {
      return result(record.recordId, "ProcessingFailed", record.data);
    }
    const output = `${JSON.stringify(flatten(event))}\n`;
    return result(
      record.recordId,
      "Ok",
      Buffer.from(output, "utf8").toString("base64"),
    );
  } catch {
    return result(record.recordId, "ProcessingFailed", record.data);
  }
}
