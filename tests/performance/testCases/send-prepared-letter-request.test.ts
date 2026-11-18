import { PublishBatchCommand } from "@aws-sdk/client-sns";

let mockRun: () => Promise<void>;
let mockTimeout: number;
let mockSend: (command: PublishBatchCommand) => Promise<unknown>;

const mockTest = (_name: string, run: () => Promise<void>) => {
  mockRun = run;
};
mockTest.describe = (_name: string, run: () => void) => run();
mockTest.setTimeout = (timeout: number) => {
  mockTimeout = timeout;
};

jest.mock("@playwright/test", () => {
  const actual = jest.requireActual("@playwright/test");
  return { expect: actual.expect, test: mockTest };
});

jest.mock("tests/helpers/aws-sns-helper", () => ({
  snsClient: { send: (command: PublishBatchCommand) => mockSend(command) },
}));

jest.mock("tests/helpers/pino-logger", () => ({
  logger: { info: () => {} },
}));

beforeAll(async () => {
  await import("./send-prepared-letter-request.spec");
});

it("publishes all letters in bounded batches", async () => {
  let calls = 0;
  let inFlight = 0;
  let maxInFlight = 0;
  let entries = 0;
  const ids = new Set<string>();
  mockSend = async (command) => {
    calls += 1;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    const batch = command.input.PublishBatchRequestEntries ?? [];
    entries += batch.length;
    for (const entry of batch) {
      ids.add(entry.Id!);
    }
    await Promise.resolve();
    inFlight -= 1;
    return { Successful: batch.map(({ Id }) => ({ Id })) };
  };

  await mockRun();

  expect(calls).toBe(25_000);
  expect(entries).toBe(250_000);
  expect(ids.size).toBe(250_000);
  expect(maxInFlight).toBe(10);
  expect(mockTimeout).toBe(60 * 60 * 1000);
});

it("stops publishing when SNS reports a failed entry", async () => {
  let calls = 0;
  let inFlight = 0;
  mockSend = async (command) => {
    calls += 1;
    inFlight += 1;
    const first = calls === 1;
    await Promise.resolve();
    inFlight -= 1;
    const batch = command.input.PublishBatchRequestEntries ?? [];
    return first
      ? { Failed: [{ Id: batch[0].Id, Message: "failed" }] }
      : { Successful: batch.map(({ Id }) => ({ Id })) };
  };

  await expect(mockRun()).rejects.toThrow(
    "SNS failed to publish batch entries",
  );
  expect(calls).toBe(10);
  expect(inFlight).toBe(0);
});

it("fails when SNS does not confirm every entry", async () => {
  mockSend = async () => ({ Successful: [] });

  await expect(mockRun()).rejects.toThrow(
    "SNS confirmed 0 of 10 batch entries",
  );
});
