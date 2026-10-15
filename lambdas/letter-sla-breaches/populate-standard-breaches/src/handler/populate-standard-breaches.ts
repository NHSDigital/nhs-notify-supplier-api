import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import buildStandardBreachesQuery from "./standard-breaches-query";

export type PopulateStandardBreachesEvent = {
  date: string;
};

export type PopulateStandardBreachesResult = {
  status: "SUCCESS" | "FAILURE";
  failureReason?: string;
  breachCount: string;
};

export default function createHandler(deps: Deps) {
  return async (
    event: PopulateStandardBreachesEvent,
  ): Promise<PopulateStandardBreachesResult> => {
    try {
      const rows = await runAthenaQuery(
        deps,
        buildStandardBreachesQuery(
          deps.env.EVENT_CACHE_TABLE_NAME,
          new Date(event.date.slice(0, 10)),
          14,
        ),
      );

      const breachCount = String(
        rows.reduce((total, row) => total + Number(row.breach_count ?? 0), 0),
      );

      // TODO: CCM-24041 process the query results to populate standard breaches.
      deps.logger.info(
        { date: event.date, breachCount },
        "Standard breaches query completed",
      );

      return { status: "SUCCESS", breachCount };
    } catch (error) {
      deps.logger.error(
        { date: event.date, error },
        "Failed to populate standard breaches",
      );

      return {
        status: "FAILURE",
        failureReason: error instanceof Error ? error.message : String(error),
        breachCount: "0",
      };
    }
  };
}
