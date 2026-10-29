import fetchBankHolidays from "../handler/bank-holidays";

describe("fetchBankHolidays", () => {
  const mockJson = {
    "england-and-wales": {
      division: "england-and-wales",
      events: [
        {
          title: "Christmas Day",
          date: "2026-12-25",
          notes: "",
          bunting: true,
        },
        {
          title: "Boxing Day",
          date: "2026-12-28",
          notes: "Substitute day",
          bunting: true,
        },
        {
          title: "New Year's Day",
          date: "2027-01-01",
          notes: "",
          bunting: true,
        },
      ],
    },
    scotland: {
      division: "scotland",
      events: [
        {
          title: "St Andrew's Day",
          date: "2026-11-30",
          notes: "",
          bunting: true,
        },
      ],
    },
  };

  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockJson),
      ok: true,
      status: 200,
    }),
  ) as jest.Mock;

  it("fetches and parses English bank holidays from gov.uk", async () => {
    const results = await fetchBankHolidays("dummy-url");
    expect(results).toEqual([
      new Date("2026-12-25"),
      new Date("2026-12-28"),
      new Date("2027-01-01"),
    ]);
  });

  it("handles error responses", async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    await expect(fetchBankHolidays("dummy-url")).rejects.toEqual(
      new Error("Response status: 404"),
    );
  });
});
