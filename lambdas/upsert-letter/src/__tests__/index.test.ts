import type { Context, SQSEvent } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import handler from "..";

describe("event-logging Lambda", () => {
  it("completes successfully", async () => {
    const event = { Records: [{ body: "{}" }] } as SQSEvent;
    const context = mockDeep<Context>();
    const callback = jest.fn();
    await handler(event, context, callback);
  });
});
