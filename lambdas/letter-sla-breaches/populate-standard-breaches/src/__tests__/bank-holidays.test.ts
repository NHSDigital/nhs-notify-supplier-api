import { NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type Deps } from "../handler/deps";
import fetchBankHolidays, {
  BANK_HOLIDAY_CACHE_KEY,
} from "../handler/bank-holidays";

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

const cachedJson = {
  "england-and-wales": {
    events: [{ date: "2026-05-04" }],
  },
};

const expectedDates = [
  new Date("2026-12-25"),
  new Date("2026-12-28"),
  new Date("2027-01-01"),
];

function makeDeps(s3Send: jest.Mock): Deps {
  return {
    s3Client: { send: s3Send } as unknown as S3Client,
    logger: { info: jest.fn(), warn: jest.fn() },
    env: {
      BANK_HOLIDAY_JSON_URL: "https://example.com/bank-holidays.json",
      BANK_HOLIDAY_CACHE_BUCKET_NAME: "reporting-bucket",
    },
  } as unknown as Deps;
}

function mockFetchSuccess(json: unknown = mockJson) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(json),
  });
}

function mockFetchStatus(status: number) {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status });
}

function cachedObject(json: unknown) {
  return {
    Body: { transformToString: () => Promise.resolve(JSON.stringify(json)) },
  };
}

describe("fetchBankHolidays", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches and parses English bank holidays from gov.uk", async () => {
    mockFetchSuccess();
    const s3Send = jest.fn().mockResolvedValue({});

    const results = await fetchBankHolidays(makeDeps(s3Send));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/bank-holidays.json",
    );
    expect(results).toEqual(expectedDates);
  });

  it("caches the fetched bank holidays in S3", async () => {
    mockFetchSuccess();
    const s3Send = jest.fn().mockResolvedValue({});

    await fetchBankHolidays(makeDeps(s3Send));

    expect(s3Send).toHaveBeenCalledTimes(1);
    const put = s3Send.mock.calls[0][0] as PutObjectCommand;
    expect(put).toBeInstanceOf(PutObjectCommand);
    expect(put.input).toEqual({
      Bucket: "reporting-bucket",
      Key: BANK_HOLIDAY_CACHE_KEY,
      Body: JSON.stringify(mockJson),
      ContentType: "application/json",
    });
  });

  it("still returns the fetched bank holidays if caching fails", async () => {
    mockFetchSuccess();
    const s3Send = jest.fn().mockRejectedValue(new Error("S3 down"));
    const deps = makeDeps(s3Send);

    const results = await fetchBankHolidays(deps);

    expect(results).toEqual(expectedDates);
    expect(deps.logger.warn).toHaveBeenCalledWith({
      err: new Error("S3 down"),
      description: "Failed to cache bank holidays in S3",
    });
  });

  it("falls back to the cached value on an error response", async () => {
    mockFetchStatus(503);
    const s3Send = jest.fn().mockResolvedValue(cachedObject(cachedJson));
    const deps = makeDeps(s3Send);

    const results = await fetchBankHolidays(deps);

    expect(results).toEqual([new Date("2026-05-04")]);
    expect(deps.logger.warn).toHaveBeenCalledWith({
      err: new Error("Response status: 503"),
      description:
        "Failed to fetch bank holidays, falling back to cached value",
    });
  });

  it("falls back to the cached value when fetch throws", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("network"));
    const s3Send = jest.fn().mockResolvedValue(cachedObject(cachedJson));

    const results = await fetchBankHolidays(makeDeps(s3Send));

    expect(results).toEqual([new Date("2026-05-04")]);
  });

  it("falls back to the cached value when the response is invalid", async () => {
    mockFetchSuccess({ unexpected: true });
    const s3Send = jest.fn().mockResolvedValue(cachedObject(cachedJson));

    const results = await fetchBankHolidays(makeDeps(s3Send));

    expect(results).toEqual([new Date("2026-05-04")]);
  });

  it("throws if the fetch fails and there is no cached value", async () => {
    mockFetchStatus(404);
    const s3Send = jest
      .fn()
      .mockRejectedValue(new NoSuchKey({ message: "missing", $metadata: {} }));

    await expect(fetchBankHolidays(makeDeps(s3Send))).rejects.toEqual(
      new Error(
        "Failed to fetch bank holidays and no cached value is available",
      ),
    );
  });

  it("throws if the fetch fails and the cached object is empty", async () => {
    mockFetchStatus(500);
    const s3Send = jest.fn().mockResolvedValue({});

    await expect(fetchBankHolidays(makeDeps(s3Send))).rejects.toThrow(
      "Failed to fetch bank holidays and no cached value is available",
    );
  });

  it("propagates other errors reading the cache", async () => {
    mockFetchStatus(500);
    const s3Send = jest.fn().mockRejectedValue(new Error("Access denied"));

    await expect(fetchBankHolidays(makeDeps(s3Send))).rejects.toThrow(
      "Access denied",
    );
  });
});
