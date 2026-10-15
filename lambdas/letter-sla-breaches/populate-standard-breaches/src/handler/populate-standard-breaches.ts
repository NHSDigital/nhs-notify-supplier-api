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
  breachCounts: string;
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
          new Date(),
          14,
        ),
      );

      // TODO: CCM-24041 process the query results to populate standard breaches.
      deps.logger.info(
        { date: event.date, breachCounts: JSON.stringify(rows) },
        "Standard breaches query completed",
      );

      return { status: "SUCCESS", breachCounts: JSON.stringify(rows) };
    } catch (error) {
      deps.logger.error(
        { date: event.date, error },
        "Failed to populate standard breaches",
      );

      return {
        status: "FAILURE",
        failureReason: error instanceof Error ? error.message : String(error),
        breachCounts: "-",
      };
    }
  };
}
