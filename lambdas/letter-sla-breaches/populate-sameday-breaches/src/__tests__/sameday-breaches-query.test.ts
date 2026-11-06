import {
  TrinoContext,
  runParameterisedQueryOnTrino,
  runTrinoStatement,
  setupTrinoContainer,
} from "@internal/sql-test-helpers";
import { TZDate } from "@date-fns/tz";
import buildSamedayBreachesQuery from "../handler/sameday-breaches-query";

type LetterEvent = {
  domainid: string;
  specificationid: string;
  status: string;
  clientid: string;
  campaignid: string;
  supplierid: string;
  time: string;
};

const EVENT_TABLE_NAME = "event_cache";
const PACK_SPECIFICATION_TABLE_NAME = "pack_specification";
const TEST_TIMEOUT_MS = 60_000;

async function insertEvents(context: TrinoContext, events: LetterEvent[]) {
  const values = events
    .map(
      ({
        campaignid,
        clientid,
        domainid,
        specificationid,
        status,
        supplierid,
        time,
      }) => {
        const [year, month, day] = time.slice(0, 10).split("-");
        return `('${domainid}', '${specificationid}', '${status}', '${supplierid}', '${clientid}', '${campaignid}', '${time}', '${year}', '${month}', '${day}')`;
      },
    )
    .join(",\n");

  await runTrinoStatement(
    context,
    `INSERT INTO ${EVENT_TABLE_NAME} (
      domainid, specificationid, status, supplierid, clientid, campaignid,
      time, __year, __month, __day
    ) VALUES ${values}`,
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

function sort(rows: Record<string, string | undefined>[]) {
  return rows.toSorted(
    (a, b) =>
      (a.supplierid ?? "").localeCompare(b.supplierid ?? "") ||
      (a.campaignid ?? "").localeCompare(b.campaignid ?? "") ||
      (a.clientid ?? "").localeCompare(b.clientid ?? ""),
  );
}

describe("buildSamedayBreachesQuery", () => {
  jest.setTimeout(TEST_TIMEOUT_MS);

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
        clientid VARCHAR,
        campaignid VARCHAR,
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
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      // Not a breach: completed
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "DISPATCHED",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Breach: a non-terminal status does not complete the letter
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-10-12T10:00:00.000Z",
      },
      {
        domainid: "letter-4",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
        status: "ACCEPTED",
        time: "2026-10-13T10:00:00.000Z",
      },
      // Breach: first PENDING event is used, even if repeated later
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-10-12T11:00:00.000Z",
      },
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
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
          clientid: "client-b",
          campaignid: "campaign-b",
          status: "PENDING",
          specificationid: "same_day",
          time: "2026-10-12T10:00:00.000Z",
        },
        {
          domainid: `letter-terminal-${i}`,
          supplierid: "supplier-b",
          clientid: "client-b",
          campaignid: "campaign-b",
          specificationid: "same_day",
          status,
          time: "2026-10-13T10:00:00.000Z",
        },
      ]),
      // Breaching, but ignored: before the 14-day window
      {
        domainid: "letter-6",
        supplierid: "supplier-c",
        clientid: "client-c",
        campaignid: "campaign-c",
        specificationid: "same_day",
        status: "PENDING",
        time: "2026-09-01T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildSamedayBreachesQuery(
        EVENT_TABLE_NAME,
        PACK_SPECIFICATION_TABLE_NAME,
        now,
        14,
      ),
    );

    expect(sort(rows)).toEqual([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "1",
      },
      {
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        breach_count: "2",
      },
    ]);
  });

  test("Letters breach at midnight if sent before 15:00, or at midnight the next day if sent after 15:00", async () => {
    await insertEvents(context, [
      // will breach midnight of sameday
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 11:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // will breach midnight of sameday
      {
        domainid: "letter-2",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 14:59:59")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // will breach midnight of next day
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 15:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // will breach midnight of next day
      {
        domainid: "letter-4",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "same_day",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 16:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
      // will breach midnight of next day
      {
        domainid: "letter-5",
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        specificationid: "same_day",
        status: "PENDING",
        time: atZoneEuropeLondon("2026-10-14 18:00:00")
          .withTimeZone("UTC")
          .toISOString(),
      },
    ]);

    const [
      rowsBefore2400On14th,
      rowsAfter2400On14th,
      rowsBefore2400On15th,
      rowsAfter2400On15th,
    ] = await Promise.all(
      [
        atZoneEuropeLondon("2026-10-14 23:59:59"),
        atZoneEuropeLondon("2026-10-15 00:00:01"),
        atZoneEuropeLondon("2026-10-15 23:59:59"),
        atZoneEuropeLondon("2026-10-16 00:00:01"),
      ].map(async (day) =>
        runParameterisedQueryOnTrino(
          context,
          buildSamedayBreachesQuery(
            EVENT_TABLE_NAME,
            PACK_SPECIFICATION_TABLE_NAME,
            day,
            14,
          ),
        ),
      ),
    );
    expect(rowsBefore2400On14th).toHaveLength(0);
    expect(sort(rowsAfter2400On14th)).toEqual([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "1",
      },
      {
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        breach_count: "1",
      },
    ]);
    expect(sort(rowsBefore2400On15th)).toEqual([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "1",
      },
      {
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        breach_count: "1",
      },
    ]);
    expect(sort(rowsAfter2400On15th)).toEqual([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "3",
      },
      {
        supplierid: "supplier-b",
        clientid: "client-b",
        campaignid: "campaign-b",
        breach_count: "2",
      },
    ]);
  });

  it("ignores standard letters and letters in an accessible format", async () => {
    const now = new Date("2026-10-14T12:00:00.000Z");

    await insertEvents(context, [
      {
        domainid: "letter-1",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "standard",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-2",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "braille",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
      {
        domainid: "letter-3",
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        specificationid: "audio",
        status: "PENDING",
        time: "2026-10-11T10:00:00.000Z",
      },
    ]);

    const rows = await runParameterisedQueryOnTrino(
      context,
      buildSamedayBreachesQuery(
        EVENT_TABLE_NAME,
        PACK_SPECIFICATION_TABLE_NAME,
        now,
        14,
      ),
    );

    expect(rows).toHaveLength(0);
  });
});
