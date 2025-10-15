import { z } from "zod";
import { $EnvelopeProfile } from './envelope-profile'
import { $LetterStatus, $LetterStatusChange, LetterStatus } from "../domain/letter-status-change";

const eventSchema = (status: LetterStatus) => $EnvelopeProfile.safeExtend({
  type: z.literal(`uk.nhs.notify.supplier-api.letter-status.${status}.v1`),
  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/events\\/supplier-api\\/letter-status\\/${status}\\/1\\.\\d+\\.\\d+\\.json$`),
    ),
  // Matches semantic versioning format with fixed major version
  dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/),
  // This replaces the data definition from EnvelopeProfile rather than extending it
  data: $LetterStatusChange.extend({
    status: z.literal(status)
  }),
}).meta({
  title: `letter-status.${status} Event`,
  description: `Event schema for letter status change to ${status}`
});

export const letterStatusChangeEventsMap = Object.fromEntries(
  $LetterStatus.options.map(
    (status) => ([`letter-status.${status}`, eventSchema(status)])
  ));

export const $LetterStatusChangeEvent = $EnvelopeProfile.safeExtend({
  type: z.enum($LetterStatus.options.map(status => `uk.nhs.notify.supplier-api.letter-status.${status}.v1`)),
  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/events\\/supplier-api\\/letter-status\\/(?<status>${$LetterStatus.options.join('|')})\\/1\\.\\d+\\.\\d+\\.json$`),
    ),
  // Matches semantic versioning format with fixed major version
  dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/),
  // This replaces the data definition from EnvelopeProfile rather than extending it
  data: $LetterStatusChange,
}).meta({
  title: `letter-status.* Event`,
  description: `Event schema for generic letter status change`
});
export type LetterStatusChangeEvent = z.infer<typeof $LetterStatusChangeEvent>;
