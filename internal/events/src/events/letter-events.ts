import { z } from "zod";
import {
  $Letter,
  $LetterStatus,
  LetterStatus,
} from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/domain/letter";
import { EventEnvelope } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/event-envelope";

/**
 * A generic schema for parsing any letter status change event
 */
export const $LetterEvent = EventEnvelope(
  "letter",
  "letter",
  $Letter,
  $LetterStatus.options.map((status) => status.toLowerCase()),
  "letter-origin",
).meta({
  title: `letter.* Event`,
  description: `Event schema for generic letter status change`,
});
export type LetterEvent = z.infer<typeof $LetterEvent>;

/**
 * Specialise the generic event schema for a single status
 * @param status
 */
const eventSchema = (status: LetterStatus) =>
  EventEnvelope(
    `letter.${status.toLowerCase()}`,
    "letter",
    $Letter,
    [status],
    "letter-origin",
  ).meta({
    title: `letter.${status.toLowerCase()} Event`,
    description: `Event schema for letter status change to ${status}`,
  });

export const letterEventMap = Object.fromEntries(
  $LetterStatus.options.map((status) => [
    `letter.${status}`,
    eventSchema(status),
  ]),
);
