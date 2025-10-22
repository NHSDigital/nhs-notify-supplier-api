import { z } from 'zod';
import { DomainBase } from '@internal/helpers'

/**
 * Status values for letters in the supplier-api domain
 */
export const $LetterStatus = z.enum([
  'PENDING', 'ACCEPTED', 'REJECTED', 'PRINTED',
  'ENCLOSED', 'CANCELLED', 'DISPATCHED', 'FAILED',
  'RETURNED', 'FORWARDED', 'DELIVERED']).meta({
    title: "Letter Status",
    description: "The status of a letter in the supplier-api domain.",
    examples: ["ACCEPTED", "REJECTED", "PRINTED"]
  });

export type LetterStatus = z.infer<typeof $LetterStatus>;

/**
 * Schema for letter status change events
 */
export const $Letter = DomainBase('Letter').extend({
  origin: z.object({
    domain: z.string(),
    source: z.string(),
    subject: z.string()
  }).meta({
    title: "Letter origin",
    description: `The origin domain identifier, source and subject of the original event that introduced the letter to the supplier-api domain.

The identifier will be included as the origin in the subject of any corresponding events emitted by the supplier-api domain.`,
    examples: [{
      domain: "letter-rendering",
      source: "/data-plane/letter-rendering/prod/render-pdf",
      subject: "customer/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-rendering/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
    }]
  }),
  specificationId: z.string().meta({
    title: "Specification ID",
    description: "Reference to the letter specification which was used to produce a letter pack for this request.",
    examples: ["1y3q9v1zzzz"]
  }),
  groupId: z.string().meta({
    title: "Group ID",
    description: "Identifier for the group which this letter assigned to for reporting purposes.",
    examples: ["client_template", "00f3b388-bbe9-41c9-9e76-052d37ee8988_20a1ab22-6136-47ae-ac0f-989f382be8df"]
  }),
  status: $LetterStatus,
  reasonCode: z.string().optional().meta({
    title: "Reason Code",
    description: "Optional reason code for the status change, if applicable.",
    examples: ["R01", "R08"]
  }),
  reasonText: z.string().optional().meta({
    title: "Reason Text",
    description: "Optional human-readable reason for the status change, if applicable.",
    examples: ["Undeliverable", "Recipient moved"]
  })
});

export type Letter = z.infer<typeof $Letter>;
