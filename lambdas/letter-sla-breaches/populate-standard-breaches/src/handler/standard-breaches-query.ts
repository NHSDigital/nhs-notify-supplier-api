import {
  type AthenaQuery,
  buildAthenaDatePredicate,
} from "@internal/letter-sla-breaches-common";
import { startOfDay, subBusinessDays } from "date-fns";
import { TZDate } from "@date-fns/tz";

export default function buildStandardBreachesQuery(
  eventsTableName: string,
  packSpecificationTableName: string,
  now: Date,
  slaWorkingDays: number,
  daysToLookBack: number,
): AthenaQuery {
  const nowEuropeLondon = new TZDate(now, "Europe/London");
  const slaCutOff = subBusinessDays(
    startOfDay(nowEuropeLondon),
    slaWorkingDays,
  );
  return {
    queryString: `WITH parameters AS (
    SELECT from_iso8601_timestamp(?) AS sla_cutoff
),
recent_letter_events AS (
    SELECT domainid, supplierid, specificationid, status, from_iso8601_timestamp(time) AS event_time
    FROM ${eventsTableName}
    WHERE ${buildAthenaDatePredicate(now, daysToLookBack)}
),
allocated_letters AS (
    SELECT domainid, supplierid, specificationid
    FROM recent_letter_events
    WHERE status = 'PENDING'
    GROUP BY domainid, supplierid, specificationid
    HAVING min(event_time) < (select sla_cutoff from parameters)
),
completed_letters AS (
    SELECT domainid
    FROM recent_letter_events
    WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED', 'RETURNED', 'DELIVERED')
    GROUP BY domainid, supplierid
)
SELECT supplierid, count(*) AS breach_count
FROM (
  SELECT domainid, supplierid
  FROM allocated_letters
  WHERE domainid NOT IN (SELECT domainid FROM completed_letters)
  AND cardinality(array_intersect(
    (SELECT COALESCE(assembly.features, ARRAY[]) FROM ${packSpecificationTableName} spec WHERE spec.id = specificationid),
    ARRAY['SAME_DAY', 'BRAILLE', 'AUDIO']
  )) = 0
)
GROUP BY supplierid`,
    executionParameters: [`'${slaCutOff.toISOString()}'`],
  };
}
