import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
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
          new Date(),
          14,
        ),
      );

      const breachCount = String(
        rows.reduce((total, row) => total + Number(row.breach_count ?? 0), 0),
      );

      // TODO: CCM-24041 process the query results to populate sameday breaches.
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
