import { type AthenaQuery } from "@internal/letter-sla-breaches-common";

export default function buildUnallocatedBreachesQuery(
  subTableName: string,
  pubTableName: string,
  now: Date,
  daysHistory: number,
): AthenaQuery {
  return {
    queryString: `WITH now AS (
    SELECT from_iso8601_timestamp(?) AS iso8601
),
unpack_sub AS (
    SELECT
        json_extract_scalar(message, '$.data.domainId')        AS domainid,
        json_extract_scalar(message, '$.data.supplierId')      AS supplierid,
        json_extract_scalar(message, '$.data.clientId')        AS clientid,
        json_extract_scalar(message, '$.data.campaignId')      AS campaignid
    FROM ${subTableName}
    WHERE from_iso8601_timestamp(timestamp) >= date_add(
        'day',
        -CAST(? AS integer),
        (SELECT iso8601 FROM now)
    )
),
unpack_pub AS (
    SELECT
        json_extract_scalar(message, '$.data.domainId')       AS domainid
    FROM ${pubTableName}
    WHERE json_extract_scalar(message,'$.data.status') = 'PENDING'
)
SELECT s.supplierid, s.clientid, s.campaignid, count(*) AS breach_count
FROM unpack_sub s
LEFT JOIN unpack_pub p ON s.domainid = p.domainid
WHERE p.domainid IS NULL
GROUP BY s.supplierid, s.clientid, s.campaignid`,
    executionParameters: [now.toISOString(), String(daysHistory)],
  };
}
