import {
  $LetterRequestPreparedEvent,
  LetterRequestPreparedEvent,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering-v1";
import { $LetterStatusChangeEvent } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/letter-events";
import {
  $LetterRequestPreparedEventV2,
  LetterRequestPreparedEventV2,
} from "@nhsdigital/nhs-notify-event-schemas-letter-rendering";
import z from "zod";
import { Deps } from "../config/deps";

export type PreparedEvents =
  | LetterRequestPreparedEventV2
  | LetterRequestPreparedEvent;

const SupplierSpecSchema = z.object({
  supplierId: z.string().min(1),
  specId: z.string().min(1),
  priority: z.int().min(0).max(99).default(10),
  billingId: z.string().min(1),
});

export type SupplierSpec = z.infer<typeof SupplierSpecSchema>;

export const PreparedEventUnionSchema = z.discriminatedUnion("type", [
  $LetterRequestPreparedEventV2,
  $LetterRequestPreparedEvent,
]);

export const AllocatedLetterSchema = z.object({
  letterEvent: PreparedEventUnionSchema,
  supplierSpec: SupplierSpecSchema,
});

export type AllocatedLetter = z.infer<typeof AllocatedLetterSchema>;

export const QueueMessageSchema = z.union([
  $LetterStatusChangeEvent,
  AllocatedLetterSchema,
]);

export type QueueMessage = z.infer<typeof QueueMessageSchema>;

export type UpsertOperation = {
  name: "Insert" | "Update";
  schemas: z.ZodSchema[];
  handler: (
    request: unknown,
    supplierSpec: SupplierSpec,
    deps: Deps,
  ) => Promise<void>;
};
