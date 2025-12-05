import { LetterEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src";
import { randomBytes, randomUUID } from "node:crypto";
import eventSchemaPackage from "@nhsdigital/nhs-notify-event-schemas-supplier-api/package.json";
import { LetterWithSupplierId } from "../types";

export default function mapLetterToCloudEvent(
  letter: LetterWithSupplierId,
): LetterEvent {
  const now = new Date().toISOString();
  const eventId = randomUUID();
  const dataschemaversion = eventSchemaPackage.version;
  return {
    specversion: "1.0",
    id: eventId,
    type: `uk.nhs.notify.supplier-api.letter.${letter.status}.v1`,
    plane: "data",
    dataschema: `https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.${letter.status}.${dataschemaversion}.schema.json`,
    dataschemaversion,
    source: "/data-plane/supplier-api/letters",
    subject: `letter-origin/supplier-api/letter/${letter.id}`,

    data: {
      domainId: letter.id as LetterEvent["data"]["domainId"],
      status: letter.status,
      specificationId: letter.specificationId,
      supplierId: letter.supplierId,
      groupId: letter.groupId,
      reasonCode: letter.reasonCode,
      reasonText: letter.reasonText,
      origin: {
        domain: "supplier-api",
        source: "/data-plane/supplier-api/letters",
        subject: `letter-origin/supplier-api/letter/${letter.id}`,
        event: eventId,
      },
    },
    time: now,
    datacontenttype: "application/json",
    traceparent: `00-${randomBytes(16).toString("hex")}-${randomBytes(8).toString("hex")}-01`,
    recordedtime: now,
    severitynumber: 2,
    severitytext: "INFO",
  };
}
