import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import { type Deps } from "./deps";
import buildStandardBreachesQuery from "./standard-breaches-query";
import fetchBankHolidays from "./bank-holidays";

export type PopulateStandardBreachesEvent = {
  date: string;
};

export default function createHandler(deps: Deps) {
  return async (event: PopulateStandardBreachesEvent): Promise<void> => {
    const bankHolidays = await fetchBankHolidays(deps);
    const sql = buildStandardBreachesQuery(
      deps.env.EVENT_CACHE_TABLE_NAME,
      deps.env.PACK_SPECIFICATION_TABLE_NAME,
      new Date(event.date),
      deps.env.STANDARD_SLA_WORKING_DAYS,
      deps.env.DAYS_TO_LOOK_BACK,
      bankHolidays,
    );
    deps.logger.info({ description: "Generated query", sql });
    const rows = await runAthenaQuery(deps, sql);

    // Calculate and log total for the benefit of the alarm - that way the alarm will clear when the breaches query returns
    // no rows.

    const totalBreaches = rows
      .map((row) => Number(row.breach_count!))
      .reduce((a, b) => a + b, 0);
    deps.logger.info(
      buildEMFObject(
        "",
        {},
        {
          key: "StandardBreachTotal",
          value: totalBreaches,
          unit: Unit.Count,
        },
      ),
    );

    for (const row of rows) {
      const emfObject = buildEMFObject(
        "",
        { SupplierId: row.supplierid! },
        {
          key: "StandardBreachCount",
          value: Number(row.breach_count!),
          unit: Unit.Count,
        },
      );
      deps.logger.info(emfObject);
    }
  };
}
