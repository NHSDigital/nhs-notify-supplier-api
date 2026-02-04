import { MessageProviderPact } from "@pact-foundation/pact";
import {
  LETTER_STATUSES,
  getMessageProviderForStatus,
  getPactUrlForStatus,
} from "./utils/utils";

const CONSUMER_PACKAGE = "@nhsdigital/notify-core-consumer-contracts";

describe("Supplier API letter status provider tests", () => {
  describe.each(LETTER_STATUSES)("letter.%s event", (status) => {
    test(`verifies letter-${status.toLowerCase()} pact`, async () => {
      const p = new MessageProviderPact({
        provider: `letter-${status.toLowerCase()}`,
        messageProviders: getMessageProviderForStatus(status),
        pactUrls: [getPactUrlForStatus(CONSUMER_PACKAGE, status)],
        logLevel: "error",
      });

      await expect(p.verify()).resolves.not.toThrow();
    }, 60_000);
  });
});
