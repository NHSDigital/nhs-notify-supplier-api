import path from "node:path";
import { MessageProviderPact } from "@pact-foundation/pact";
import LetterRequestPreparedEvent from "@nhsdigital/nhs-notify-event-schemas-letter-rendering/examples/LetterRequestPrepared/v2.0.1.json";

describe("Letter rendering message provider tests", () => {
  test("verify pacts", async () => {
    const p = new MessageProviderPact({
      provider: "letter-rendering",
      pactUrls: [
        path.join(
          __dirname,
          "../../.pacts/letter-rendering/supplier-api-letter-request-prepared.json",
        ),
      ],
      messageProviders: {
        LetterRequestPrepared: async () => ({
          ...LetterRequestPreparedEvent,
        }),
      },
      logLevel: "error",
    });

    await expect(p.verify()).resolves.not.toThrow();
  }, 60_000);
});
