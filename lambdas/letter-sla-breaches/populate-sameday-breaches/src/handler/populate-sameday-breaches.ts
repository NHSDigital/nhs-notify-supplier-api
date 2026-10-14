import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import { type Deps } from "./deps";
import buildSamedayBreachesQuery from "./sameday-breaches-query";

export type PopulatesamedayBreachesEvent = {
  date: string;
};

export type PopulatesamedayBreachesResult = {
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
    event: PopulatesamedayBreachesEvent,
  ): Promise<PopulatesamedayBreachesResult> => {
    try {
      const rows = await runAthenaQuery(
        deps,
        buildSamedayBreachesQuery(
          deps.env.EVENT_CACHE_TABLE_NAME,
          deps.env.PACK_SPECIFICATION_TABLE_NAME,
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
            key: "SamedayBreachCount",
            value: Number.parseInt(row.breach_count!, 10),
            unit: Unit.Count,
          },
        );
        deps.logger.info(emfObject);
      }

      const breachCount = String(
        rows.reduce((total, row) => total + Number(row.breach_count ?? 0), 0),
      );

      // Published every run, including 0, so the alarm clears once breaches are resolved
      deps.logger.info(
        buildEMFObject(
          "",
          {},
          {
            key: "SamedayBreachTotal",
            value: Number(breachCount),
            unit: Unit.Count,
          },
        ),
      );

      deps.logger.info(
        { date: event.date, breachCount },
        "sameday breaches query completed",
      );

      return { status: "SUCCESS", breachCount };
    } catch (error) {
      deps.logger.error(
        { date: event.date, error },
        "Failed to populate sameday breaches",
      );

      return {
        status: "FAILURE",
        failureReason: error instanceof Error ? error.message : String(error),
        breachCount: "0",
      };
    }
  };
}
