import { MI } from '@internal/datastore';
import { MISubmittedEvent } from '@nhsdigital/nhs-notify-event-schemas-supplier-api/src';
import { randomUUID, randomBytes } from 'crypto';

export function mapMIToCloudEvent(mi: MI): MISubmittedEvent {
  const now = new Date().toISOString();
  const eventId = randomUUID();
  return {
    specversion: '1.0',
    id: eventId,
    type: `uk.nhs.notify.supplier-api.mi.SUBMITTED.v1`,
    dataschema: `https://notify.nhs.uk/cloudevents/schemas/supplier-api/mi.SUBMITTED.1.0.0.schema.json`,
    source: '/data-plane/supplier-api/mi',
    subject: 'mi/' + mi.id,

    data: {
      id: mi.id as MISubmittedEvent['data']['id'],
      lineItem: mi.lineItem,
      timestamp: mi.timestamp,
      quantity: mi.quantity,
      supplierId: mi.supplierId,
      createdAt: mi.createdAt,
      updatedAt: mi.updatedAt,
      specificationId: mi.specificationId,
      groupId: mi.groupId,
      stockRemaining: mi.stockRemaining
    },
    time: now,
    traceparent: `00-${randomBytes(16).toString('hex')}-${randomBytes(8).toString('hex')}-01`,
    recordedtime: now,
    severitynumber: 2,
    severitytext: 'INFO',
  };
}
