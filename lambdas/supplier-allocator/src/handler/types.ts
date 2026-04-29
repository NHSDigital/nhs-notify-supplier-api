import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";

export type SupplierSpec = {
  supplierId: string;
  specId: string;
  priority: number;
  billingId: string;
};

export type SupplierDetails = {
  supplierSpec: SupplierSpec;
  volumeGroupId: string;
};

export type PreparedEvents =
  | LetterRequestPreparedEventV2
  | LetterRequestPreparedEvent;
