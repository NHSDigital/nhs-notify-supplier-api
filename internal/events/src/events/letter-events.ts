import { z } from "zod";
import { $EnvelopeProfile } from './envelope-profile'
import { $LetterStatus, $Letter, LetterStatus } from "../domain/letter";

const eventSchema = (status: LetterStatus) => $EnvelopeProfile.safeExtend({
  type: z.literal(`uk.nhs.notify.supplier-api.letter.${status}.v1`),
  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/events\\/supplier-api\\/letter\\/${status}\\/1\\.\\d+\\.\\d+\\.json$`),
    ),
  // Matches semantic versioning format with fixed major version
  dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/),
  // This replaces the data definition from EnvelopeProfile rather than extending it
  data: $Letter.extend({
    status: z.literal(status)
  }),
}).meta({
  title: `letter.${status} Event`,
  description: `Event schema for letter status change to ${status}`
});

export const letterEventMap = Object.fromEntries(
  $LetterStatus.options.map(
    (status) => ([`letter.${status}`, eventSchema(status)])
  ));

export const $LetterEvent = $EnvelopeProfile.safeExtend({
  type: z.enum($LetterStatus.options.map(status => `uk.nhs.notify.supplier-api.letter.${status}.v1`)),
  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/events\\/supplier-api\\/letter\\/(?<status>${$LetterStatus.options.join('|')})\\/1\\.\\d+\\.\\d+\\.json$`),
    ),
  // Matches semantic versioning format with fixed major version
  dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/),
  // This replaces the data definition from EnvelopeProfile rather than extending it
  data: $Letter,
}).meta({
  title: `letter.* Event`,
  description: `Event schema for generic letter status change`
});
export type LetterEvent = z.infer<typeof $LetterEvent>;
