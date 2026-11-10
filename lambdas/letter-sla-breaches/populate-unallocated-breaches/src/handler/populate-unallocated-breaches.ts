import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import LogRefs from "../log-references";
import buildUnallocatedBreachesQuery from "./unallocated-breaches-query";

export type PopulateUnallocatedBreachesEvent = {
  date: string;
};

export type PopulateUnallocatedBreachesResult = {
  status: "SUCCESS" | "FAILURE";
  failureReason?: string;
  breachCount: string;
};

function parseEventDate(date: string): Date {
  const [datePart, timePart, ...remainingParts] = date.split(" ");
  const isAthenaTimestamp =
    timePart && remainingParts.length === 0 && !date.includes("T");

  return new Date(isAthenaTimestamp ? `${datePart}T${timePart}Z` : date);
}

export default function createHandler(deps: Deps) {
  return async (
    event: PopulateUnallocatedBreachesEvent,
  ): Promise<PopulateUnallocatedBreachesResult> => {
    try {
      const rows = await runAthenaQuery(
        deps,
        buildUnallocatedBreachesQuery(
          deps.env.SUBSCRIPTION_TABLE_NAME,
          deps.env.PUBLICATION_TABLE_NAME,
          parseEventDate(event.date),
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
            key: "UnallocatedBreachCount",
            value: Number.parseInt(row.breach_count!, 10),
            unit: Unit.Count,
          },
        );
        deps.logger.info({
          ...emfObject,
          logRef: LogRefs.BREACH_COUNT_METRIC.code,
          description: LogRefs.BREACH_COUNT_METRIC.description,
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
            key: "UnallocatedBreachTotal",
            value: Number(breachCount),
            unit: Unit.Count,
          },
        ),
        logRef: LogRefs.BREACH_TOTAL_METRIC.code,
        description: LogRefs.BREACH_TOTAL_METRIC.description,
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
