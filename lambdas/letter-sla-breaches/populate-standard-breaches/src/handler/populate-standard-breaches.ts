import { runAthenaQuery } from "@internal/letter-sla-breaches-common";
import { Unit } from "aws-embedded-metrics";
import { buildEMFObject } from "@internal/helpers";
import { type Deps } from "./deps";
import buildStandardBreachesQuery from "./standard-breaches-query";
import LogRefs from "../log-references";
import fetchBankHolidays from "./bank-holidays";

export type PopulateStandardBreachesEvent = {
  date: string;
};

export default function createHandler(deps: Deps) {
  return async (event: PopulateStandardBreachesEvent): Promise<void> => {
    const bankHolidays = await fetchBankHolidays(
      deps.env.BANK_HOLIDAY_JSON_URL,
      deps.s3Cache,
    );
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
    deps.logger.info({
      ...buildEMFObject(
        "",
        {},
        {
          key: "StandardBreachTotal",
          value: totalBreaches,
          unit: Unit.Count,
        },
      ),
      logRef: LogRefs.BREACH_TOTAL_METRIC.code,
    });

    for (const row of rows) {
      const emfObject = buildEMFObject(
        "",
        {
          SupplierId: row.supplierid || "unknown",
          ClientId: row.clientid || "unknown",
          CampaignId: row.campaignid || "unknown",
        },
        {
          key: "StandardBreachCount",
          value: Number(row.breach_count!),
          unit: Unit.Count,
        },
      );
      deps.logger.info({ ...emfObject, logRef: LogRefs.BREACH_COUNT_METRIC });
    }
  };
}
