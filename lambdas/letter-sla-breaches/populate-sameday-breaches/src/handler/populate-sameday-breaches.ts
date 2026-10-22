import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import buildSamedayBreachesQuery from "./sameday-breaches-query";

export type PopulatesamedayBreachesEvent = {
  date: string;
};

export type PopulatesamedayBreachesResult = {
  status: "SUCCESS" | "FAILURE";
  failureReason?: string;
  breachCount: string;
};

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
          new Date(event.date.slice(0, 10)),
          14,
        ),
      );

      for (const row of rows) {
        const emfObject = buildEMFObject(
          "",
          {
            SupplierId: row.supplierid!,
            ClientId: row.clientid!,
            CampaignId: row.campaignid!,
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
