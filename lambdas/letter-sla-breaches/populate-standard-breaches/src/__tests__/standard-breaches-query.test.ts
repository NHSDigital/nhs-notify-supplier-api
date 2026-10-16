import {
  TrinoContext,
  runParameterisedQueryOnTrino,
  runTrinoStatement,
  setupTrinoContainer,
} from "@internal/sql-test-helpers";
import buildStandardBreachesQuery from "../handler/standard-breaches-query";

type LetterEvent = {
  domainid: string;
  supplierid: string;
  status: string;
  time: string;
};

const TABLE_NAME = "event_cache";

async function insertEvents(context: TrinoContext, events: LetterEvent[]) {
  const values = events
    .map(({ domainid, status, supplierid, time }) => {
      const [year, month, day] = time.slice(0, 10).split("-");
      return `('${domainid}', '${supplierid}', '${status}', '${time}', '${year}', '${month}', '${day}')`;
    })
    .join(",\n");

  await runTrinoStatement(
    context,
    `INSERT INTO ${TABLE_NAME} VALUES ${values}`,
  );
}

function sortBySupplier(rows: Record<string, string | undefined>[]) {
  return rows.toSorted((a, b) =>
    (a.supplierid ?? "").localeCompare(b.supplierid ?? ""),
  );
}

describe("buildStandardBreachesQuery", () => {
  let context: TrinoContext;

  beforeAll(async () => {
    context = await setupTrinoContainer();
  }, 180_000);

  afterAll(async () => {
    await context?.container.stop();
  });

  beforeEach(async () => {
    await runTrinoStatement(
      context,
      `CREATE TABLE ${TABLE_NAME} (
        domainid VARCHAR,
        supplierid VARCHAR,
        status VARCHAR,
        time VARCHAR,
        __year VARCHAR,
        __month VARCHAR,
        __day VARCHAR
      )`,
    );
  });

  afterEach(async () => {
    await runTrinoStatement(context, `DROP TABLE IF EXISTS ${TABLE_NAME}`);
  });

  it("counts letters pending for more than 48 hours without a completed status, per supplier", async () => {
    // Wednesday
    const now = new Date("2026-10-14T12:00:00.000Z");

    await insertEvents(context, [
      // Breach: pending for > 48 hours, never completed
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      // Not a breach: completed
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        status: "DISPATCHED",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Not a breach: pending for < 48 hours
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        status: "PENDING",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Breach: a non-terminal status does not complete the letter
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        status: "PENDING",
        time: "2026-10-10T09:00:00.000Z",
      },
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        status: "ACCEPTED",
        time: "2026-10-10T10:00:00.000Z",
      },
      // Breach: first PENDING event is used, even if repeated later
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        status: "PENDING",
        time: "2026-10-12T11:00:00.000Z",
      },
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        status: "PENDING",
        time: "2026-10-14T11:00:00.000Z",
      },
      // Not a breach: each terminal status completes the letter
      ...["REJECTED", "FAILED", "CANCELLED", "FORWARDED"].flatMap(
        (status, i) => [
          {
            domainid: `letter-terminal-${i}`,
            supplierid: "supplier-b",
            status: "PENDING",
            time: "2026-10-10T10:00:00.000Z",
          },
          {
            domainid: `letter-terminal-${i}`,
            supplierid: "supplier-b",
            status,
            time: "2026-10-11T10:00:00.000Z",
          },
        ],
      ),
      // Breaching, but ignored: before the 14-day window
      {
        domainid: "letter-6",
        supplierid: "supplier-c",
        status: "PENDING",
        time: "2026-09-01T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildStandardBreachesQuery(TABLE_NAME, now, 14),
    );

    expect(sortBySupplier(rows)).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
      { supplierid: "supplier-b", breach_count: "2" },
    ]);
  });

  it("skips non-working days", async () => {
    await insertEvents(context, [
      // Received Thursday - won't breach until Monday
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        status: "PENDING",
        time: "2026-10-15T10:00:00.000Z",
      },
      // Received Friday - won't breach until Tuesday
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        status: "PENDING",
        time: "2026-10-16T10:00:00.000Z",
      },
    ]);

    const [rowsOnSaturday, rowsOnSunday, rowsOnMonday, rowsOnTuesday] =
      await Promise.all(
        [
          new Date("2026-10-17T22:00:00.000Z"),
          new Date("2026-10-18T22:00:00.000Z"),
          new Date("2026-10-19T22:00:00.000Z"),
          new Date("2026-10-20T22:00:00.000Z"),
        ].map(async (day) =>
          runParameterisedQueryOnTrino(
            context,
            buildStandardBreachesQuery(TABLE_NAME, day, 14),
          ),
        ),
      );
    expect(rowsOnSaturday).toHaveLength(0);
    expect(rowsOnSunday).toHaveLength(0);
    expect(rowsOnMonday).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsOnTuesday).toEqual([
      { supplierid: "supplier-a", breach_count: "2" },
    ]);
  });
});
