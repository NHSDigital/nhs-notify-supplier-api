import buildSamedayBreachesQuery from "../handler/sameday-breaches-query";

describe("buildSamedayBreachesQuery", () => {
  const { executionParameters, queryString } = buildSamedayBreachesQuery(
    "event_cache",
    "pack_specification",
    new Date("2026-10-08"),
    0,
  );

  it("passes the date as an execution parameter", () => {
    expect(executionParameters).toEqual(["2026-10-08T00:00:00.000Z"]);
  });

  it("selects from the event cache table filtered by the date partitions", () => {
    expect(queryString).toContain("FROM event_cache");
    expect(queryString).toContain(
      "(__year = '2026' AND __month = '10' AND __day IN ('08'))",
    );
  });

  it("selects the client and campaign of each event", () => {
    expect(queryString).toContain(
      "SELECT domainid, supplierid, status, clientid, campaignid, from_iso8601_timestamp(time) AS event_time",
    );
  });

  it.each([
    [
      "defines the same day specifications from the pack specification table",
      [
        "sameday_pack_specifications AS (",
        "SELECT id as specificationId FROM pack_specification",
        "WHERE array_join(assembly.features, ',') like '%SAME_DAY%'",
      ],
    ],
    [
      "restricts events to letters with a same day specification",
      [
        "exists (select sps.specificationId from sameday_pack_specifications sps",
        "where sps.specificationId = json_extract_scalar(recent_letter_events.data_json, '$.specificationId')",
      ],
    ],
    [
      "applies a 24 hour SLA from 16:00 UK time",
      [
        "WHEN hour(min(event_time) AT TIME ZONE 'Europe/London') >= 16",
        "THEN min(event_time) + INTERVAL '24' HOUR",
      ],
    ],
    [
      "applies an end of day SLA before 16:00 UK time",
      [
        "ELSE date_trunc('day', min(event_time) AT TIME ZONE 'Europe/London') + INTERVAL '1' DAY",
      ],
    ],
    ["only treats pending letters as allocated", ["WHERE status = 'PENDING'"]],
    [
      "excludes letters with a completed status",
      [
        "WHERE status in ('REJECTED', 'FAILED', 'CANCELLED', 'FORWARDED', 'DISPATCHED')",
        "WHERE cl.domainid IS NULL",
      ],
    ],
    [
      "matches completed events on letter, supplier, client and campaign",
      [
        "ON al.domainid = cl.domainid",
        "AND al.supplierid = cl.supplierid",
        "AND al.clientid = cl.clientid",
        "AND al.campaignid = cl.campaignid",
      ],
    ],
    [
      "returns the breach count per supplier, client and campaign",
      [
        "SELECT supplierid, clientid, campaignid, count(*) AS breach_count",
        "GROUP BY supplierid, clientid, campaignid",
      ],
    ],
  ])("%s", (_name, fragments) => {
    for (const fragment of fragments) {
      expect(queryString).toContain(fragment);
    }
  });

  it("groups allocated and completed letters by client and campaign", () => {
    const groupings = queryString.match(
      /GROUP BY domainid, supplierid, clientid, campaignid/g,
    );

    expect(groupings).toHaveLength(2);
  });
});
