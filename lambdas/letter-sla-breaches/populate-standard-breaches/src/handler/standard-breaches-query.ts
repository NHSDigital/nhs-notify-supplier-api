import {
  type AthenaQuery,
  buildAthenaDatePredicate,
} from "@internal/letter-sla-breaches-common";

export default function buildStandardBreachesQuery(
  tableName: string,
  now: Date,
  daysHistory: number,
): AthenaQuery {
  return {
    queryString: `WITH now AS (
    SELECT from_iso8601_timestamp(?) AS iso8601
),
recent_letter_events AS (
    SELECT domainid, supplierid, status, from_iso8601_timestamp(time) AS event_time
    FROM ${tableName}
    WHERE ${buildAthenaDatePredicate(now, daysHistory)}
),
allocated_letters AS (
    SELECT domainid, supplierid
    FROM recent_letter_events
    WHERE status = 'PENDING'
    GROUP BY domainid, supplierid
    HAVING min(event_time) < (SELECT iso8601 FROM now) -
        CASE WHEN day_of_week(min(event_time) AT TIME ZONE 'Europe/London') IN (4, 5, 6) THEN INTERVAL '96' HOUR ELSE INTERVAL '48' HOUR END
),
completed_letters AS (
    SELECT domainid, supplierid
    FROM recent_letter_events
    WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED')
    GROUP BY domainid, supplierid
)
SELECT supplierid, count(*) AS breach_count
FROM (
    SELECT al.domainid, al.supplierid
    FROM allocated_letters al
        LEFT JOIN completed_letters cl ON al.domainid = cl.domainid WHERE cl.domainid IS NULL
)
GROUP BY supplierid`,
    executionParameters: [`'${now.toISOString()}'`],
  };
}
