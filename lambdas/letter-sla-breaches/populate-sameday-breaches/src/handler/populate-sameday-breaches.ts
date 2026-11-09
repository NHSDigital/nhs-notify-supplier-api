import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import LogRefs from "../log-references";
import { type Deps } from "./deps";
import buildSamedayBreachesQuery from "./sameday-breaches-query";

export type PopulatesamedayBreachesEvent = {
  date: string;
};

export type PopulatesamedayBreachesResult = {
  status: "SUCCESS";
  breachCount: string;
};

export default function createHandler(deps: Deps) {
  return async (
    event: PopulatesamedayBreachesEvent,
  ): Promise<PopulatesamedayBreachesResult> => {
    const eventDate = new Date(event.date);
    if (Number.isNaN(eventDate.getTime())) {
      throw new TypeError(`Invalid event date: ${event.date}`);
    }

    try {
      const rows = await runAthenaQuery(
        deps,
        buildSamedayBreachesQuery(
          deps.env.EVENT_CACHE_TABLE_NAME,
          deps.env.PACK_SPECIFICATION_TABLE_NAME,
          eventDate,
          14,
        ),
      );

      for (const row of rows) {
        // CloudWatch drops EMF metrics whose declared dimensions are missing or empty
        const emfObject = buildEMFObject(
          "",
          {
            SupplierId: row.supplierid || "unknown",
            ClientId: row.clientid || "unknown",
            CampaignId: row.campaignid || "unknown",
          },
          {
            key: "SamedayBreachCount",
            value: Number.parseInt(row.breach_count!, 10),
            unit: Unit.Count,
          },
        );
        deps.logger.info({
          ...emfObject,
          logRef: LogRefs.BREACH_COUNT_METRIC.code,
        });
      }

      const breachCount = String(
        rows.reduce((total, row) => total + Number(row.breach_count ?? 0), 0),
      );

      // Published every run, including 0, so the alarm clears once breaches are resolved
      deps.logger.info({
        ...buildEMFObject(
          "",
          {},
          {
            key: "SamedayBreachTotal",
            value: Number(breachCount),
            unit: Unit.Count,
          },
        ),
        logRef: LogRefs.BREACH_TOTAL_METRIC.code,
      });

      deps.logger.info({
        logRef: LogRefs.QUERY_COMPLETED.code,
        description: LogRefs.QUERY_COMPLETED.description,
        date: event.date,
        breachCount,
      });

      return { status: "SUCCESS", breachCount };
    } catch (error) {
      deps.logger.error({
        logRef: LogRefs.POPULATE_FAILED.code,
        description: LogRefs.POPULATE_FAILED.description,
        date: event.date,
        error,
      });

      throw error;
    }
  };
}
