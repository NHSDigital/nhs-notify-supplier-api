import { LetterRequestPreparedEvent } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import { LetterRequestPreparedEventV2 } from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";

export type SupplierSpec = {
  supplierId: string;
  specId: string;
  priority: number;
  billingId: string;
};

export type AllocationStatus = {
  status: string;
  reasonCode?: string;
  reasonText?: string;
};

export type AllocationDetails = {
  supplierSpec: SupplierSpec;
  allocationStatus: AllocationStatus;
};

export type SupplierDetails = {
  allocationDetails: AllocationDetails;
  volumeGroupId: string;
};

export type PreparedEvents =
  | LetterRequestPreparedEventV2
  | LetterRequestPreparedEvent;
