import {
  $LetterRequestPreparedEvent,
  LetterRequestPreparedEvent,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import {
  $LetterRequestPreparedEventV2,
  LetterRequestPreparedEventV2,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";

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

export const PreparedEventSchema = z.discriminatedUnion("type", [
  $LetterRequestPreparedEventV2,
  $LetterRequestPreparedEvent,
]);

export type PreparedEvents =
  | LetterRequestPreparedEventV2
  | LetterRequestPreparedEvent;
