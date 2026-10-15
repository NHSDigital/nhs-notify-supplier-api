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
          new Date(),
          14,
        ),
      );

      // TODO: CCM-24041 process the query results to populate standard breaches.
      deps.logger.info(
        { date: event.date, breachCount: rows[0].breach_count },
        "Standard breaches query completed",
      );

      return { status: "SUCCESS", breachCount: rows[0].breach_count! };
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
