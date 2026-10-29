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

function atZoneEuropeLondon(dateTime: string) {
  const [year, month, day, hour, minute, second] = dateTime
    .split(/[- :]/)
    .map(Number);
  return new TZDate(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    "Europe/London",
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

  it("counts letters per supplier where the SLA has been breached", async () => {
    // After 2400 BST on Wednesday (i.e. early on Thursday)
    const now = new Date("2026-10-15T01:01:00.000Z");

    await insertEvents(context, [
      // Breach: received on Monday, never completed
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      // Not a breach: completed
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "DISPATCHED",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Breach: a non-terminal status does not complete the letter
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        specificationid: "standard",
        status: "ACCEPTED",
        time: "2026-10-13T10:00:00.000Z",
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
        time: "2026-10-13T11:00:00.000Z",
      },
      // Not a breach: each terminal status completes the letter
      ...[
        "REJECTED",
        "FAILED",
        "CANCELLED",
        "FORWARDED",
        "RETURNED",
        "DELIVERED",
      ].flatMap((status, i) => [
        {
          domainid: `letter-terminal-${i}`,
          supplierid: "supplier-b",
          status: "PENDING",
          specificationid: "standard",
          time: "2026-10-12T10:00:00.000Z",
        },
        {
          domainid: `letter-terminal-${i}`,
          supplierid: "supplier-b",
          specificationid: "standard",
          status,
          time: "2026-10-13T10:00:00.000Z",
        },
      ]),
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
        [],
      ),
    );

    expect(sortBySupplier(rows)).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
      { supplierid: "supplier-b", breach_count: "2" },
    ]);
  });

  test("Letters breach after two working days, at the end of the day to allow time for Royal Mail collection", async () => {
    await insertEvents(context, [
      // Received Wednesday - won't breach until after 2400 BST on Friday
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // Received Thursday - won't breach until after 2400 BST on Monday
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-15 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // Received Friday - won't breach until after 2400 BST on Tuesday
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-16 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // Received Saturday - won't breach until after 2400 BST on Tuesday
      {
        domainid: "letter-4",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-17 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // Received Sunday - won't breach until after 2400 BST on Tuesday
      {
        domainid: "letter-5",
        supplierid: "supplier-a",
        specificationid: "standard",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-18 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
    ]);

    const [
      rowsBefore2400OnFriday,
      rowsAfter2400OnFriday,
      rowsAfter2400OnSaturday,
      rowsAfter2400OnSunday,
      rowsBefore2400OnMonday,
      rowsAfter2400OnMonday,
      rowsBefore2400OnTuesday,
      rowsAfter2400OnTuesday,
    ] = await Promise.all(
      [
        atZoneEuropeLondon("2026-10-16 23:59:59"),
        atZoneEuropeLondon("2026-10-17 00:00:01"),
        atZoneEuropeLondon("2026-10-18 00:00:01"),
        atZoneEuropeLondon("2026-10-19 00:00:01"),
        atZoneEuropeLondon("2026-10-19 23:59:59"),
        atZoneEuropeLondon("2026-10-20 00:00:01"),
        atZoneEuropeLondon("2026-10-20 23:59:59"),
        atZoneEuropeLondon("2026-10-21 00:00:01"),
      ].map(async (day) =>
        runParameterisedQueryOnTrino(
          context,
          buildStandardBreachesQuery(
            EVENT_TABLE_NAME,
            PACK_SPECIFICATION_TABLE_NAME,
            day,
            2,
            14,
            [],
          ),
        ),
      ),
    );
    expect(rowsBefore2400OnFriday).toHaveLength(0);
    expect(rowsAfter2400OnFriday).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsAfter2400OnSaturday).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsAfter2400OnSunday).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsBefore2400OnMonday).toEqual([
      { supplierid: "supplier-a", breach_count: "1" },
    ]);
    expect(rowsAfter2400OnMonday).toEqual([
      { supplierid: "supplier-a", breach_count: "2" },
    ]);
    expect(rowsBefore2400OnTuesday).toEqual([
      { supplierid: "supplier-a", breach_count: "2" },
    ]);
    expect(rowsAfter2400OnTuesday).toEqual([
      { supplierid: "supplier-a", breach_count: "5" },
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
        [],
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
        [],
      ),
    );

    expect(rows).toEqual([{ supplierid: "supplier-a", breach_count: "1" }]);
  });
});
