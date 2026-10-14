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
  const slaCutOff = subtractWorkingDays(nowEuropeLondon, slaWorkingDays);
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
    WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED')
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

function subtractWorkingDays(now: TZDate, slaWorkingDays: number): TZDate {
  // We want to subtract a whole number of working days. So if today is a working day, the result will be the
  // same time of day (in the Europe/London time zone), the appropriate number of business days ago. If today is
  // not a working day, the result will be at midnight, since no working hours will have elapsed today. Bank
  // holidays are ignored for now but may be included in a future iteration.

  return now.getDay() === 6 || now.getDay() === 0
    ? subBusinessDays(startOfDay(now), slaWorkingDays)
    : subBusinessDays(now, slaWorkingDays);
}
