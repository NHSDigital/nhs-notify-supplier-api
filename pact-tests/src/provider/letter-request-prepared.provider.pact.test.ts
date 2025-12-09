import fs from "node:fs";
import path from "node:path";
import { MessageProviderPact } from "@pact-foundation/pact";
import { getSampleEvent } from "../utils/get-sample-events";

const EVENT_TYPE = "LetterRequestPrepared";

describe("Letter rendering message provider tests", () => {
  const p = new MessageProviderPact({
    provider: "letter-rendering",
    pactUrls: [
      path.join(
        __dirname,
        "../../.pacts/letter-rendering/supplier-api-letter-request-prepared.json",
      ),
    ],
    messageProviders: {
      [EVENT_TYPE]: async () =>
        JSON.parse(fs.readFileSync(getSampleEvent(EVENT_TYPE), "utf8")),
    },
    logLevel: "error",
  });

  test("verify pacts", async () => {
    await expect(p.verify()).resolves.not.toThrow();
  }, 60_000);
});
