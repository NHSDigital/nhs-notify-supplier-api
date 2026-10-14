import { AthenaQuery } from "./athena";

export default function buildStandardBreachesQuery(
  tableName: string,
): AthenaQuery {
  return {
    queryString: `WITH unpacked AS (
    SELECT
        json_extract_scalar(message, '$.data.domainId')               AS domain_id,
        json_extract_scalar(message, '$.data.status')                 AS status,
        json_extract_scalar(message, '$.data.specificationId')         AS specification_id,
        json_extract_scalar(message, '$.data.billingRef')              AS billing_ref,
        json_extract_scalar(message, '$.data.supplierId')              AS supplier_id,
        json_extract_scalar(message, '$.data.groupId')                 AS group_id,
        json_extract_scalar(message, '$.data.reasonCode')              AS reason_code,
        json_extract_scalar(message, '$.data.reasonText')              AS reason_text,
        from_iso8601_timestamp(json_extract_scalar(message, '$.time')) AS event_time
    FROM ${tableName}
),
allocated_letters AS (
    SELECT domain_id, supplier_id
    FROM unpacked
    WHERE status = 'PENDING'
    GROUP BY domain_id, supplier_id
    HAVING min(event_time) < current_timestamp -
        CASE WHEN day_of_week(current_timestamp AT TIME ZONE 'Europe/London') <= 2 THEN INTERVAL '96' HOUR ELSE INTERVAL '48' HOUR END
),
completed_letters AS (
    SELECT domain_id, supplier_id
    FROM unpacked
    WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED')
    GROUP BY domain_id, supplier_id
)
SELECT supplier_id, count(*)
FROM (
    SELECT al.domain_id, al.supplier_id
    FROM allocated_letters al
        LEFT JOIN completed_letters cl ON al.domain_id = cl.domain_id WHERE cl.domain_id IS NULL
)
GROUP BY supplier_id`,
  };
}
