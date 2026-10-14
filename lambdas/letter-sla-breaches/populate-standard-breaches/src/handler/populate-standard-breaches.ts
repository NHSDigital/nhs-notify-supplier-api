import {
  type Deps,
  runAthenaQuery,
} from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import buildStandardBreachesQuery from "./standard-breaches-query";

export type PopulateStandardBreachesEvent = {
  date: string;
};

export default function createHandler(deps: Deps) {
  return async (event: PopulateStandardBreachesEvent): Promise<void> => {
    const sql = buildStandardBreachesQuery(
      deps.env.EVENT_CACHE_TABLE_NAME,
      deps.env.PACK_SPECIFICATION_TABLE_NAME,
      new Date(event.date),
      deps.env.STANDARD_SLA_WORKING_DAYS,
      deps.env.DAYS_TO_LOOK_BACK,
    );
    const rows = await runAthenaQuery(deps, sql);

    for (const row of rows) {
      const emfObject = buildEMFObject(
        "",
        { SupplierId: row.supplierid! },
        {
          key: "BreachCount",
          value: Number.parseInt(row.breach_count!, 10),
          unit: Unit.Count,
        },
        [[], ["SupplierId"]],
      );
      deps.logger.info(emfObject);
    }
  };
}
