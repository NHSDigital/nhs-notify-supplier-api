import type { SQSEvent } from "aws-lambda";
import { supplierConfigHandler } from "..";

describe("supplierConfigHandler", () => {
  it("returns an empty batchItemFailures list", async () => {
    const event = { Records: [] } as unknown as SQSEvent;

    const result = await supplierConfigHandler(event);

    expect(result).toEqual({ batchItemFailures: [] });
  });
});
