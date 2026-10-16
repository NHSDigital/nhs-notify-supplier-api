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
      const sql = buildStandardBreachesQuery(
        deps.env.EVENT_CACHE_TABLE_NAME,
        new Date(event.date),
        14,
      );
      const rows = await runAthenaQuery(deps, sql);

      // TODO: CCM-24041 process the query results to populate standard breaches.
      deps.logger.info({
        description: "Standard breaches query completed",
        date: event.date,
        breachCounts: JSON.stringify(rows),
      });

      return { status: "SUCCESS", breachCounts: JSON.stringify(rows) };
    } catch (error) {
      deps.logger.error({
        description: "Failed to populate standard breaches",
        date: event.date,
        error,
      });
      return {
        status: "FAILURE",
        failureReason: error instanceof Error ? error.message : String(error),
        breachCounts: "-",
      };
    }
  };
}
