import {
  TrinoContext,
  runParameterisedQueryOnTrino,
  runTrinoStatement,
  setupTrinoContainer,
} from "@internal/sql-test-helpers";
import { TZDate } from "@date-fns/tz";
import buildStandardBreachesQuery from "../handler/standard-breaches-query";

type LetterEvent = {
  domainid: string;
  specificationid: string;
  status: string;
  supplierid: string;
  time: string;
};

const EVENT_TABLE_NAME = "event_cache";
const PACK_SPECIFICATION_TABLE_NAME = "pack_specification";

async function insertEvents(context: TrinoContext, events: LetterEvent[]) {
  const values = events
    .map(({ domainid, specificationid, status, supplierid, time }) => {
      const [year, month, day] = time.slice(0, 10).split("-");
      return `('${domainid}', '${specificationid}', '${status}', '${supplierid}', '${time}', '${year}', '${month}', '${day}')`;
    })
    .join(",\n");

  await runTrinoStatement(
    context,
    `INSERT INTO ${EVENT_TABLE_NAME} VALUES ${values}`,
  );
}

async function insertPackSpecifications(
  context: TrinoContext,
  specifications: { id: string; features: string[] }[],
) {
  const packSpecifications = specifications.map((specification) => {
    const featuresArray = `ARRAY['${specification.features.join("', '")}']`;
    return `('${specification.id}', ROW(${featuresArray}))`;
  });

  await runTrinoStatement(
    context,
    `INSERT INTO ${PACK_SPECIFICATION_TABLE_NAME} VALUES ${packSpecifications}`,
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

    await runTrinoStatement(
      context,
      `CREATE TABLE ${PACK_SPECIFICATION_TABLE_NAME} (
        id VARCHAR,
        assembly ROW(features ARRAY(VARCHAR))
      )`,
    );
    await insertPackSpecifications(context, [
      { id: "standard", features: [] },
      { id: "braille", features: ["BRAILLE"] },
      { id: "audio", features: ["AUDIO"] },
      { id: "same_day", features: ["SAME_DAY"] },
      { id: "admail", features: ["ADMAIL"] },
    ]);
  }, 180_000);

  afterAll(async () => {
    await runTrinoStatement(
      context,
      `DROP TABLE IF EXISTS ${PACK_SPECIFICATION_TABLE_NAME}`,
    );
    await context?.container.stop();
  });

  beforeEach(async () => {
    await runTrinoStatement(
      context,
      `CREATE TABLE ${EVENT_TABLE_NAME} (
        domainid VARCHAR,
        specificationid VARCHAR,
        status VARCHAR,
        supplierid VARCHAR,
        time VARCHAR,
        __year VARCHAR,
        __month VARCHAR,
        __day VARCHAR
      )`,
    );
  });

  afterEach(async () => {
    await runTrinoStatement(
      context,
      `DROP TABLE IF EXISTS ${EVENT_TABLE_NAME}`,
    );
  });

  it("counts letters pending for more than 48 hours without a completed status, per supplier", async () => {
    // Wednesday
    const now = new Date("2026-10-14T12:00:00.000Z");

    await insertEvents(context, [
      // Breach: pending for > 48 hours, never completed
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      // Not a breach: completed
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "DISPATCHED",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Not a breach: pending for < 48 hours
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Breach: a non-terminal status does not complete the letter
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-10T09:00:00.000Z",
      },
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "ACCEPTED",
        time: "2026-10-10T10:00:00.000Z",
      },
      // Breach: first PENDING event is used, even if repeated later
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-12T11:00:00.000Z",
      },
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-2T11:00:00.000Z",
      },
      // Not a breach: each terminal status completes the letter
      ...["REJECTED", "FAILED", "CANCELLED", "FORWARDED"].flatMap(
        (status, i) => [
          {
            domainid: `letter-terminal-${i}`,
            supplierid: "supplier-b",
            status: "PENDING",
            specificationid: "standard",
            time: "2026-10-10T10:00:00.000Z",
          },
          {
            domainid: `letter-terminal-${i}`,
            supplierid: "supplier-b",
            specificationid: "standard",
            status,
            time: "2026-10-11T10:00:00.000Z",
          },
        ],
      ),
      // Breaching, but ignored: before the 14-day window
      {
        domainid: "letter-6",
        supplierid: "supplier-c",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-09-01T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildStandardBreachesQuery(
        EVENT_TABLE_NAME,
        PACK_SPECIFICATION_TABLE_NAME,
        now,
        2,
        14,
      ),
    );

    expect(sortBySupplier(rows)).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
      { supplierid: "supplier-b", breach_count: "2" },
    ]);
  });

  it("skips non-working days", async () => {
    await insertEvents(context, [
      // Received Thursday - won't breach until allocation time on Monday
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: new TZDate("2026-10-15 11:00:00", "Europe/London").toISOString(),
      },
      // Received Friday - won't breach until allocation time on Tuesday
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: new TZDate("2026-10-16 11:00:00", "Europe/London").toISOString(),
      },
      // Received Saturday - won't breach until midnight on Wednesday
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: new TZDate("2026-10-17 11:00:00", "Europe/London").toISOString(),
      },
      // Received Sunday - won't breach until midnight on Wednesday
      {
        domainid: "letter-4",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: new TZDate("2026-10-18 11:00:00", "Europe/London").toISOString(),
      },
    ]);

    const [
      rowsOnSaturdayAfter1100,
      rowsOnSundayAfter1100,
      rowsOnMondayAfter1100,
      rowsOnTuesdayAfter1100,
      rowsOnWednesdayAfterMidnight,
    ] = await Promise.all(
      [
        new TZDate("2026-10-17 11:00:01", "Europe/London"),
        new TZDate("2026-10-18 11:00:01", "Europe/London"),
        new TZDate("2026-10-19 11:00:01", "Europe/London"),
        new TZDate("2026-10-20 11:00:01", "Europe/London"),
        new TZDate("2026-10-21 00:00:01", "Europe/London"),
      ].map(async (day) =>
        runParameterisedQueryOnTrino(
          context,
          buildStandardBreachesQuery(
            EVENT_TABLE_NAME,
            PACK_SPECIFICATION_TABLE_NAME,
            day,
            2,
            14,
          ),
        ),
      ),
    );
    expect(rowsOnSaturdayAfter1100).toHaveLength(0);
    expect(rowsOnSundayAfter1100).toHaveLength(0);
    expect(rowsOnMondayAfter1100).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsOnTuesdayAfter1100).toEqual([
      { supplierid: "supplier-a", breach_count: "2" },
    ]);
    expect(rowsOnWednesdayAfterMidnight).toEqual([
      { supplierid: "supplier-a", breach_count: "4" },
    ]);
  });

  it("ignores same-day letters and letters in an accessible format", async () => {
    const now = new Date("2026-10-14T12:00:00.000Z");

    await insertEvents(context, [
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "braille",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        specificationid: "audio",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildStandardBreachesQuery(
        EVENT_TABLE_NAME,
        PACK_SPECIFICATION_TABLE_NAME,
        now,
        2,
        14,
      ),
    );

    expect(rows).toHaveLength(0);
  });

  it("does not ignore admail", async () => {
    const now = new Date("2026-10-14T12:00:00.000Z");

    await insertEvents(context, [
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "admail",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildStandardBreachesQuery(
        EVENT_TABLE_NAME,
        PACK_SPECIFICATION_TABLE_NAME,
        now,
        2,
        14,
      ),
    );

    expect(rows).toEqual([{ supplierid: "supplier-a", breach_count: "1" }]);
  });
});
