/* eslint-disable security/detect-unsafe-regex, sonarjs/slow-regex */
import path from "node:path";
import {
  MatchersV3,
  MessageConsumerPact,
  asynchronousBodyHandler,
} from "@pact-foundation/pact";
import { $LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";

async function handle(event: unknown) {
  $LetterRequestPreparedEventV2.parse(event);
}

describe("Pact Message Consumer - LetterRequestPrepared Event", () => {
  const messagePact = new MessageConsumerPact({
    consumer: "supplier-api",
    provider: "letter-request-prepared",
    dir: path.resolve(__dirname, "../../.pacts/letter-rendering"),
    pactfileWriteMode: "update",
    logLevel: "error",
  });

  it("should validate a LetterRequest PREPARED v2 event", async () => {
    await messagePact
      .expectsToReceive("LetterRequestPrepared")
      .withContent({
        id: MatchersV3.uuid("12f1f09c-a555-4d9b-8405-0b33490bc929"),
        time: MatchersV3.datetime(
          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
          "2025-07-29T08:50:57.350Z",
        ),
        type: "uk.nhs.notify.letter-rendering.letter-request.prepared.v2",
        source: MatchersV3.string(
          "/data-plane/letter-rendering/prod/render-pdf",
        ),
        specversion: MatchersV3.regex(/\d+\.\d+/, "1.0"),
        datacontenttype: "application/json",
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.2.0.0.schema.json",
        dataschemaversion: MatchersV3.regex(/\d+\.\d+\.\d+/, "2.0.0"),
        traceparent: MatchersV3.string(
          "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
        ),
        recordedtime: MatchersV3.datetime(
          "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
          "2025-08-28T08:45:00.000Z",
        ),
        severitynumber: MatchersV3.number(2),
        severitytext: "INFO",
        plane: "data",
        subject: MatchersV3.regex(
          /^client\/[\d_a-z-]+\/letter-request\/[^/]+(?:\/.*)?$/,
          "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
        ),
        data: {
          campaignId: MatchersV3.string("flu-campaign-2025"),
          clientId: MatchersV3.string("987e6543-21c0-4d5b-8f9a-abcdef123456"),
          createdAt: MatchersV3.datetime(
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "2025-07-29T08:45:00.000Z",
          ),
          domainId: MatchersV3.string(
            "1y3q9987e6543-21c0-4d5b-8f9a-abcdef123456_34hEIElNxpdXPrNv6OBbU0bqNwG_34hEP2Xc3rGunPUAPe0Mst9IIoA",
          ),
          pageCount: MatchersV3.number(1),
          requestId: MatchersV3.string("34hEIFCIw5DUTCRDMGv70CEzGgF"),
          requestItemId: MatchersV3.string("34hEIElNxpdXPrNv6OBbU0bqNwG"),
          requestItemPlanId: MatchersV3.string("34hEP2Xc3rGunPUAPe0Mst9IIoA"),
          letterVariantId: MatchersV3.string("1y3q9v2zzzz"),
          sha256Hash: MatchersV3.string(
            "3a7bd3e2360a3d80c4d4e8b1e3e5e6e7e8e9e0e1e2e3e4e5e6e7e8e9e0e1e2e3",
          ),
          status: "PREPARED",
          templateId: MatchersV3.string("template-005"),
          url: MatchersV3.regex(
            /^s3:\/\/.+/,
            "s3://comms-123456789012-eu-west-2-pdf-pipeline/rendered/client/35b9VJ4ejJZXk0Z9HtQI9khryiz_35b9VgjHJYKoseXAHWT9i44qSbz.pdf",
          ),
        },
      })
      .verify(asynchronousBodyHandler(handle));
  });
});
