import {
  type AthenaQuery,
  buildAthenaDatePredicate,
} from "@internal/letter-sla-breaches-common";

export default function buildSamedayBreachesQuery(
  tableName: string,
  now: Date,
  daysHistory: number,
): AthenaQuery {
  return {
    queryString: `WITH now AS (
    SELECT from_iso8601_timestamp(?) AS iso8601
),
sameday_pack_specifications AS (
    SELECT id as specificationId FROM nhs_pr742_supapi_pack_specification
    WHERE array_join(assembly.features, ',') like '%SAME_DAY%'
),
recent_letter_events AS (
    SELECT domainid, supplierid, status, clientid, campaignid, from_iso8601_timestamp(time) AS event_time
    FROM ${tableName}
    WHERE ${buildAthenaDatePredicate(now, daysHistory)}
    AND exists (select sps.specificationId from sameday_pack_specifications sps
                where sps.specificationId = json_extract_scalar(recent_letter_events.data_json, '$.specificationId') )
),
allocated_letters AS (
    SELECT domainid, supplierid, clientid, campaignid
    FROM recent_letter_events
    WHERE status = 'PENDING'
    GROUP BY domainid, supplierid, clientid, campaignid
    HAVING (SELECT iso8601 FROM now) >
        CASE
            WHEN hour(min(event_time) AT TIME ZONE 'Europe/London') >= 16
                THEN min(event_time) + INTERVAL '24' HOUR
            ELSE date_trunc('day', min(event_time) AT TIME ZONE 'Europe/London') + INTERVAL '1' DAY
        END
),
completed_letters AS (
    SELECT domainid, supplierid, clientid, campaignid
    FROM recent_letter_events
    WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED')
    GROUP BY domainid, supplierid, clientid, campaignid
)
SELECT supplierid, clientid, campaignid, count(*) AS breach_count
FROM (
    SELECT al.domainid, al.supplierid, al.clientid, al.campaignid
    FROM allocated_letters al
        LEFT JOIN completed_letters cl
        ON al.domainid = cl.domainid
        AND al.supplierid = cl.supplierid
        AND al.clientid = cl.clientid
        AND al.campaignid = cl.campaignid
    WHERE cl.domainid IS NULL
)
GROUP BY supplierid, clientid, campaignid`,
    executionParameters: [now.toISOString()],
  };
}
