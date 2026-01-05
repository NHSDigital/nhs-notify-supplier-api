import { ListTopicsCommand, PublishCommand } from "@aws-sdk/client-sns";
import { expect, test } from "@playwright/test";
import getRestApiGatewayBaseUrl from "tests/helpers/aws-gateway-helper";
import { snsClient } from "tests/helpers/aws-sns-helper";

// prepared letter (Core)
const preparedLetter = `{
  "data": {
    "campaignId": "campaign_456",
    "clientId": "00f3b388-bbe9-41c9-9e76-052d37ee8988",
    "createdAt": "2025-08-28T08:45:00.000Z",
    "domainId": "letter1",
    "letterVariantId": "lv1",
    "pageCount": 2,
    "requestId": "0o5Fs0EELR0fUjHjbCnEtdUwQe3",
    "requestItemId": "0o5Fs0EELR0fUjHjbCnEtdUwQe4",
    "requestItemPlanId": "0o5Fs0EELR0fUjHjbCnEtdUwQe5",
    "sha256Hash": "3a7bd3e2360a3d29eea436fcfb7e44c735d117c8f2f1d2d1e4f6e8f7e6e8f7e6",
    "status": "PREPARED",
    "templateId": "template_123",
    "url": "s3://nhs-820178564574-eu-west-2-pr280-supapi-test-letters/letter1.png"
  },
  "datacontenttype": "application/json",
  "dataschema": "https://notify.nhs.uk/cloudevents/schemas/letter-rendering/letter-request.prepared.1.0.0.schema.json",
  "dataschemaversion": "1.0.0",
  "id": "23f1f09c-a555-4d9b-8405-0b33490bc920",
  "plane": "data",
  "recordedtime": "2025-08-28T08:45:00.000Z",
  "severitynumber": 2,
  "severitytext": "INFO",
  "source": "/data-plane/letter-rendering/prod/render-pdf",
  "specversion": "1.0",
  "subject": "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
  "time": "2025-08-28T08:45:00.000Z",
  "traceparent": "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
  "type": "uk.nhs.notify.letter-rendering.letter-request.prepared.v1"
}`;
//  supplier event
const supplierEvent = JSON.stringify({
  data: {
    domainId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    groupId: "client_template",
    origin: {
      domain: "letter-rendering",
      event: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      source: "/data-plane/letter-rendering/prod/render-pdf",
      subject:
        "client/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
    },
    specificationId: "1y3q9v1zzzz",
    status: "ACCEPTED",
    supplierId: "supplier1",
  },
  datacontenttype: "application/json",
  dataschema:
    "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.ACCEPTED.1.0.0.schema.json",
  dataschemaversion: "1.0.0",
  id: "23f1f09c-a555-4d9b-8405-0b33490bc920",
  plane: "data",
  recordedtime: "2025-08-28T08:45:00.000Z",
  severitynumber: 2,
  severitytext: "INFO",
  source: "/data-plane/supplier-api/prod/update-status",
  specversion: "1.0",
  subject:
    "letter-origin/letter-rendering/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
  time: "2025-08-28T08:45:00.000Z",
  traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
  type: "uk.nhs.notify.supplier-api.letter.ACCEPTED.v1",
});

test.describe("initial describe", () => {
  test("Listing Topics", async () => {
    const response = await snsClient.send(new ListTopicsCommand({}));
    console.log("Listing topics");
    console.log(response);
  });

  test("publish command", async () => {
    console.log("about to sent a message");
    const letterResponse = await snsClient.send(
      new PublishCommand({
        Message: preparedLetter,
        TopicArn:
          "arn:aws:sns:eu-west-2:820178564574:nhs-pr328-supapi-eventsub",
      }),
    );
    console.log(letterResponse);
    const eventResponse = await snsClient.send(
      new PublishCommand({
        Message: supplierEvent,
        TopicArn:
          "arn:aws:sns:eu-west-2:820178564574:nhs-pr328-supapi-eventsub",
      }),
    );
    console.log(eventResponse);
  });
});
