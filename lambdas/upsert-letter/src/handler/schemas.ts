import { $LetterStatusChangeEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";

import z from "zod";
import { Deps } from "../config/deps";
import {
  $MinimumLetterEvent,
  AllocationDetails,
  AllocationDetailsSchema,
} from "../../../common/types";

export const AllocatedLetterSchema = z.object({
  letterEvent: $MinimumLetterEvent,
  allocationDetails: AllocationDetailsSchema,
});

export type AllocatedLetter = z.infer<typeof AllocatedLetterSchema>;

export const QueueMessageSchema = z.union([
  AllocatedLetterSchema,
  $LetterStatusChangeEvent,
]);

export type QueueMessage = z.infer<typeof QueueMessageSchema>;

export type UpsertOperation = {
  name: "Insert" | "Update";
  schema: z.ZodType;
  handler: (
    request: unknown,
    allocationDetails: AllocationDetails,
    deps: Deps,
  ) => Promise<void>;
};
