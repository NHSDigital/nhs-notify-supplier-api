import { z } from "zod";
import { EventEnvelope } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/event-envelope";
import { $MI } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/domain/mi";

export const $MISubmittedEvent = EventEnvelope("mi.SUBMITTED", "mi", $MI, [
  "SUBMITTED",
]).meta({
  title: `mi.SUBMITTED Event`,
  description: `Event schema for reporting that MI data has been submitted`,
});
export type MISubmittedEvent = z.infer<typeof $MISubmittedEvent>;
