import { z } from "zod";
import DomainBase from "./domain-base";

/**
 * Status values for letters in the supplier-api domain
 */
export const $LetterStatus = z
  .enum([
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "PRINTED",
    "ENCLOSED",
    "CANCELLED",
    "DISPATCHED",
    "FAILED",
    "RETURNED",
    "FORWARDED",
    "DELIVERED",
  ])
  .meta({
    title: "Letter Status",
    description: "The status of a letter in the supplier-api domain.",
    examples: ["ACCEPTED", "REJECTED", "PRINTED"],
  });

export type LetterStatus = z.infer<typeof $LetterStatus>;

/**
 * Schema for letter status change events
 */
export const $Letter = DomainBase("Letter")
  .extend({
    origin: z
      .object({
        domain: z.string().meta({
          title: "Domain ID",
          description: "The domain which requested this letter",
        }),

        source: z.string().meta({
          title: "Event source",
          description: "The source of the event which created this letter",
        }),

        subject: z.string().meta({
          title: "Event subject",
          description:
            "The subject of the event which created this letter, scoped to source",
        }),

        event: z.string().meta({
          title: "Event ID",
          description: "The ID of the event which created this letter",
        }),
      })
      .meta({
        title: "Letter origin",
        description: `Identifiers captured from the original event that introduced the letter to the supplier-api domain.

The identifier will be included as the origin domain in the subject of any corresponding events emitted by the supplier-api domain.`,
        examples: [
          {
            domain: "letter-rendering",
            subject:
              "customer/00f3b388-bbe9-41c9-9e76-052d37ee8988/letter-rendering/letter-request/0o5Fs0EELR0fUjHjbCnEtdUwQe4_0o5Fs0EELR0fUjHjbCnEtdUwQe5",
            event: "00f3b388-bbe9-41c9-9e76-052d37ee8988",
          },
        ],
      }),

    specificationId: z.string().meta({
      title: "Specification ID",
      description:
        "Reference to the letter specification which was used to produce a letter pack for this request.",
      examples: ["1y3q9v1zzzz"],
    }),

    groupId: z.string().meta({
      title: "Group ID",
      description:
        "Identifier for the group which this letter assigned to for reporting purposes.",
      examples: [
        "client_template",
        "00f3b388-bbe9-41c9-9e76-052d37ee8988_20a1ab22-6136-47ae-ac0f-989f382be8df",
      ],
    }),

    status: $LetterStatus,

    reasonCode: z
      .string()
      .optional()
      .meta({
        title: "Reason Code",
        description:
          "Optional reason code for the status change, if applicable.",
        examples: ["R01", "R08"],
      }),

    reasonText: z
      .string()
      .optional()
      .meta({
        title: "Reason Text",
        description:
          "Optional human-readable reason for the status change, if applicable.",
        examples: ["Undeliverable", "Recipient moved"],
      }),
  })
  .meta({
    title: "Letter",
    description: `The status of a letter in the supplier-api domain.

This will include the current production status, any reason provided for the status, if applicable, and identifiers used for grouping in reports.`,
  });

export type Letter = z.infer<typeof $Letter>;
