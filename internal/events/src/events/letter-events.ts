import {z} from "zod";
import {$EnvelopeProfile} from './envelope-profile'
import {$LetterStatus, $Letter, LetterStatus} from "../domain/letter";

/**
 * A generic schemea for parsing any letter status change event
 */
export const $LetterEvent = $EnvelopeProfile.safeExtend({
  type: z.enum($LetterStatus.options.map(status => `uk.nhs.notify.supplier-api.letter.${status}.v1`)).meta({
    title: `Letter event type`,
    description: "Event type using reverse-DNS style",
    examples: [
      "uk.nhs.notify.supplier-api.letter.PENDING.v1",
      "uk.nhs.notify.supplier-api.letter.ACCEPTED.v1",
      "uk.nhs.notify.supplier-api.letter.DISPATCHED.v1",
    ],
  }),

  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/cloudevents\\/schemas\\/supplier-api\\/letter\\.(?<status>${$LetterStatus.options.join('|')})\\.1\\.\\d+\\.\\d+\\.schema.json$`),
    ).meta({
      title: "Data Schema URI",
      description:
        `URI of a schema that describes the event data

Data schema version must match the major version indicated by the type`,
      examples: [
        "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.ACCEPTED.1.0.0.schema.json",
      ],
    }),

  dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/).meta({
    title: "Data Schema Version",
    description: "Matches semantic versioning format with fixed major version (Not part of cloudevents spec?)"
  }),

  source: z.string().regex(/^\/data-plane\/supplier-api(?:\/.*)?$/).meta({
    title: "Event Source",
    description: "Logical event producer path within the supplier-api domain"
  }),

  subject: z.string().regex(/^letter-origin\/[a-z0-9-]+\/letter\/[^/]+(?:\/.*)?/).meta({
    title: "Event Subject",
    description: "Resource path (no leading slash) within the source made of segments separated by '/'.",
    examples: ["letter-origin/letter-rendering/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479"]
  }),

  // This replaces the data definition from EnvelopeProfile rather than extending it
  data: $Letter.meta({
    title: "Letter",
    description: `The status of a letter in the supplier-api domain.

This will include the current production status, any reason provided for the status, if applicable, and identifiers used for grouping in reports.`,
  }),
}).meta({
  title: `letter.* Event`,
  description: `Event schema for generic letter status change`
});
export type LetterEvent = z.infer<typeof $LetterEvent>;


/**
 * Specialise the generic event schema for a single status
 * @param status
 */
const eventSchema = (status: LetterStatus) => $LetterEvent.safeExtend({
  type: z.literal(`uk.nhs.notify.supplier-api.letter.${status}.v1`).meta({
    title: `Letter ${status} event type`,
    description: "Event type using reverse-DNS style",
    examples: [`uk.nhs.notify.supplier-api.letter.${status}.v1`],
  }),

  dataschema: z
    .string()
    .regex(
      new RegExp(`^https:\\/\\/notify\\.nhs\\.uk\\/cloudevents\\/schemas\\/supplier-api\\/letter.${status}.1\\.\\d+\\.\\d+\\.schema.json$`),
    ).meta({
      title: "Data Schema URI",
      description:
        `URI of a schema that describes the event data

Data schema version must match the major version indicated by the type`,
      examples: [
        "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.ACCEPTED.1.0.0.schema.json"
      ],
    }),

  data: $Letter.extend({
    status: z.literal(status)
  }).meta({
    title: "Letter",
    description: `The status of a letter in the supplier-api domain.

This will include the current production status, any reason provided for the status, if applicable, and identifiers used for grouping in reports.

For this event the status is always \`${status}\``,
  })
}).meta({
  title: `letter.${status} Event`,
  description: `Event schema for letter status change to ${status}`
});

export const letterEventMap = Object.fromEntries(
  $LetterStatus.options.map(
    (status) => ([`letter.${status}`, eventSchema(status)])
  ));
