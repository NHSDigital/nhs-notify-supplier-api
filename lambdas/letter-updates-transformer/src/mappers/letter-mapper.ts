import { LetterEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { randomBytes, randomUUID } from "node:crypto";
import eventSchemaPackage from "@nhsdigital/nhs-notify-event-schemas-supplier-api/package.json";
import { LetterForEventPub } from "../types";

export default function mapLetterToCloudEvent(
  letter: LetterForEventPub,
  source: string,
): LetterEvent {
  const eventId = randomUUID();
  const dataschemaversion = eventSchemaPackage.version;
  return {
    specversion: "1.0",
    id: eventId,
    type: `uk.nhs.notify.supplier-api.letter.${letter.status}.v1`,
    plane: "data",
    dataschema: `https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.${letter.status}.${dataschemaversion}.schema.json`,
    dataschemaversion,
    source,
    subject: `letter-origin/supplier-api/letter/${letter.id}`,

    data: {
      domainId: letter.id as LetterEvent["data"]["domainId"],
      status: letter.status,
      specificationId: letter.specificationId,
      billingRef: letter.billingRef,
      supplierId: letter.supplierId,
      groupId: letter.groupId,
      reasonCode: letter.reasonCode,
      reasonText: letter.reasonText,
      origin: {
        domain: "supplier-api",
        source: letter.source,
        subject: letter.subject,
        event: eventId,
      },
    },
    time: letter.updatedAt,
    datacontenttype: "application/json",
    traceparent: `00-${randomBytes(16).toString("hex")}-${randomBytes(8).toString("hex")}-01`,
    recordedtime: letter.updatedAt,
    severitynumber: 2,
    severitytext: "INFO",
  };
}
