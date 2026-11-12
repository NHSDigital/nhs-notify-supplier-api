import {
  TrinoContext,
  runParameterisedQueryOnTrino,
  runTrinoStatement,
  setupTrinoContainer,
} from "@internal/sql-test-helpers";
import buildUnallocatedBreachesQuery from "../handler/unallocated-breaches-query";

type SubscriptionEvent = {
  domainId: string;
  supplierId?: string;
  clientId?: string;
  campaignId?: string;
  timestamp: string;
};

type PublicationEvent = {
  domainId: string;
  status: string;
  timestamp: string;
};

const SUBSCRIPTION_TABLE_NAME = "event_sub_cache";
const PUBLICATION_TABLE_NAME = "event_pub_cache";
const TEST_TIMEOUT_MS = 60_000;

async function insertMessages(
  context: TrinoContext,
  tableName: string,
  events: { timestamp: string; data: Record<string, string | undefined> }[],
) {
  const values = events
    .map(({ data, timestamp }) => {
      const message = JSON.stringify({ data }).replaceAll("'", "''");
      return `('${timestamp}', '${message}')`;
    })
    .join(",\n");

  await runTrinoStatement(
    context,
    `INSERT INTO ${tableName} (timestamp, message) VALUES ${values}`,
  );
}

const insertSubscriptionEvents = (
  context: TrinoContext,
  events: SubscriptionEvent[],
) =>
  insertMessages(
    context,
    SUBSCRIPTION_TABLE_NAME,
    events.map(({ timestamp, ...data }) => ({ timestamp, data })),
  );

const insertPublicationEvents = (
  context: TrinoContext,
  events: PublicationEvent[],
) =>
  insertMessages(
    context,
    PUBLICATION_TABLE_NAME,
    events.map(({ timestamp, ...data }) => ({ timestamp, data })),
  );

function sort(rows: Record<string, string | undefined>[]) {
  return rows.toSorted(
    (a, b) =>
      (a.supplierid ?? "").localeCompare(b.supplierid ?? "") ||
      (a.campaignid ?? "").localeCompare(b.campaignid ?? "") ||
      (a.clientid ?? "").localeCompare(b.clientid ?? ""),
  );
}

describe("buildUnallocatedBreachesQuery", () => {
  jest.setTimeout(TEST_TIMEOUT_MS);

  let context: TrinoContext;

  beforeAll(async () => {
    context = await setupTrinoContainer();
  }, 180_000);

  afterAll(async () => {
    await context?.container.stop();
  });

  beforeEach(async () => {
    await Promise.all(
      [SUBSCRIPTION_TABLE_NAME, PUBLICATION_TABLE_NAME].map((tableName) =>
        runTrinoStatement(
          context,
          `CREATE TABLE ${tableName} (timestamp VARCHAR, message VARCHAR)`,
        ),
      ),
    );
  });

  afterEach(async () => {
    await Promise.all(
      [SUBSCRIPTION_TABLE_NAME, PUBLICATION_TABLE_NAME].map((tableName) =>
        runTrinoStatement(context, `DROP TABLE IF EXISTS ${tableName}`),
      ),
    );
  });

  const runQuery = (now: Date, daysHistory = 14) =>
    runParameterisedQueryOnTrino(
      context,
      buildUnallocatedBreachesQuery(
        SUBSCRIPTION_TABLE_NAME,
        PUBLICATION_TABLE_NAME,
        now,
        daysHistory,
      ),
    );

  it("counts subscribed letters per supplier that have no PENDING publication", async () => {
    const now = new Date("2026-10-15T01:01:00.000Z");

    await insertSubscriptionEvents(context, [
      // Breach: never published
      {
        domainId: "letter-1",
        supplierId: "supplier-a",
        clientId: "client-a",
        campaignId: "campaign-a",
        timestamp: "2026-10-12T10:00:00.000Z",
      },
      // Not a breach: published as PENDING
      {
        domainId: "letter-2",
        supplierId: "supplier-a",
        clientId: "client-a",
        campaignId: "campaign-a",
        timestamp: "2026-10-12T10:00:00.000Z",
      },
      // Breach: a publication with another status does not allocate the letter
      {
        domainId: "letter-3",
        supplierId: "supplier-b",
        clientId: "client-b",
        campaignId: "campaign-b",
        timestamp: "2026-10-12T10:00:00.000Z",
      },
      // Breach: never published
      {
        domainId: "letter-4",
        supplierId: "supplier-b",
        clientId: "client-b",
        campaignId: "campaign-b",
        timestamp: "2026-10-13T10:00:00.000Z",
      },
      // Breaching, but ignored: before the 14-day window
      {
        domainId: "letter-5",
        supplierId: "supplier-c",
        clientId: "client-c",
        campaignId: "campaign-c",
        timestamp: "2026-09-01T10:00:00.000Z",
      },
    ]);
    await insertPublicationEvents(context, [
      {
        domainId: "letter-2",
        status: "PENDING",
        timestamp: "2026-10-12T11:00:00.000Z",
      },
      {
        domainId: "letter-3",
        status: "ACCEPTED",
        timestamp: "2026-10-12T11:00:00.000Z",
      },
      // Unrelated to any subscription event
      {
        domainId: "letter-6",
        status: "PENDING",
        timestamp: "2026-10-12T11:00:00.000Z",
      },
    ]);

    const rows = await runQuery(now);

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

  it("includes events inside the window and excludes those just outside it", async () => {
    const now = new Date("2026-10-15T00:00:00.000Z");

    await insertSubscriptionEvents(context, [
      {
        domainId: "inside",
        supplierId: "supplier-a",
        clientId: "client-a",
        campaignId: "campaign-a",
        timestamp: "2026-10-01T00:00:01.000Z",
      },
      {
        domainId: "outside",
        supplierId: "supplier-b",
        clientId: "client-b",
        campaignId: "campaign-b",
        timestamp: "2026-09-30T23:59:59.000Z",
      },
    ]);

    expect(await runQuery(now)).toEqual([
      {
        supplierid: "supplier-a",
        clientid: "client-a",
        campaignid: "campaign-a",
        breach_count: "1",
      },
    ]);
  });

  it("honours the requested number of days of history", async () => {
    const now = new Date("2026-10-15T00:00:00.000Z");

    await insertSubscriptionEvents(context, [
      {
        domainId: "letter-1",
        supplierId: "supplier-a",
        clientId: "client-a",
        campaignId: "campaign-a",
        timestamp: "2026-10-10T00:00:00.000Z",
      },
    ]);

    expect(await runQuery(now, 3)).toEqual([]);
    expect(await runQuery(now, 7)).toHaveLength(1);
  });

  it("returns no rows when every subscribed letter has been published as PENDING", async () => {
    const now = new Date("2026-10-15T00:00:00.000Z");

    await insertSubscriptionEvents(context, [
      {
        domainId: "letter-1",
        supplierId: "supplier-a",
        clientId: "client-a",
        campaignId: "campaign-a",
        timestamp: "2026-10-12T10:00:00.000Z",
      },
    ]);
    await insertPublicationEvents(context, [
      {
        domainId: "letter-1",
        status: "PENDING",
        timestamp: "2026-10-12T11:00:00.000Z",
      },
    ]);

    expect(await runQuery(now)).toEqual([]);
  });
});
