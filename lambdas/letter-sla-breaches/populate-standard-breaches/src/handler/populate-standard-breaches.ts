import runAthenaQuery from "./athena";
import { Deps } from "./deps";
import buildStandardBreachesQuery from "./standard-breaches-query";

export type PopulateStandardBreachesEvent = {
  date: string;
};

export type PopulateStandardBreachesResult = {
  status: "SUCCESS" | "FAILURE";
  failureReason?: string;
  rowsReturned: number;
};

export default function createHandler(deps: Deps) {
  return async (
    event: PopulateStandardBreachesEvent,
  ): Promise<PopulateStandardBreachesResult> => {
    try {
      const rows = await runAthenaQuery(
        deps,
        buildStandardBreachesQuery(deps.env.EVENT_CACHE_TABLE_NAME, new Date()),
      );

      // TODO: CCM-24041 process the query results to populate standard breaches.
      deps.logger.info(
        { date: event.date, rowsReturned: rows.length },
        "Standard breaches query completed",
      );

      return { status: "SUCCESS", rowsReturned: rows.length };
    } catch (error) {
      deps.logger.error(
        { date: event.date, error },
        "Failed to populate standard breaches",
      );

      return {
        status: "FAILURE",
        failureReason: error instanceof Error ? error.message : String(error),
        rowsReturned: 0,
      };
    }
  };
}
