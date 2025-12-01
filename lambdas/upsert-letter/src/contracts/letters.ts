import { z } from "zod";

const dateTimeRegex =
  // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/regex-complexity
  /^(?:(?:\d\d[2468][048]|\d\d[13579][26]|\d\d0[48]|[02468][048]00|[13579][26]00)-02-29|\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\d|30)|(?:02)-(?:0[1-9]|1\d|2[0-8])))T(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z))$/;

export const LetterRequestPreparedEventSchema = z
  .object({
    specversion: z.literal("1.0"),

    id: z
      .string()
      .min(1)
      .regex(
        // uuid OR special all-zero OR all-f case, as per JSON Schema pattern
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
      ),

    source: z.string().regex(
      // eslint-disable-next-line security/detect-unsafe-regex
      /^\/data-plane\/letter-rendering(?:\/.*)?$/,
      "source must start with /data-plane/letter-rendering",
    ),

    subject: z.string().regex(
      // eslint-disable-next-line security/detect-unsafe-regex
      /^client\/[a-z0-9-]+\/letter-request\/[^/]+(?:\/.*)?/,
      "subject must match client/<id>/letter-request/<id>",
    ),

    type: z.literal(
      "uk.nhs.notify.letter-rendering.letter-request.PREPARED.v1",
    ),

    time: z.iso
      .datetime()
      // optional extra strict RFC3339 check, as per the JSON Schema
      .regex(dateTimeRegex, "time must be RFC3339 / date-time"),

    datacontenttype: z.literal("application/json").optional(),

    dataschema: z
      .string()
      .regex(
        /^https:\/\/notify\.nhs\.uk\/cloudevents\/schemas\/letter-rendering\/letter-request\.PREPARED\.1\.\d+\.\d+\.schema\.json$/,
      ),

    dataschemaversion: z.string().regex(/^1\.\d+\.\d+$/),

    data: z.object({
      domainId: z.string(),
      clientId: z.string(),
      campaignId: z.string().optional(),
      specificationId: z.string(),
      requestId: z.string(),
      requestItemId: z.string(),
      requestItemPlanId: z.string(),
      supplierId: z.string(),
      templateId: z.string().optional(),
      url: z.url(),
      sha256Hash: z.string(),
      createdAt: z.iso
        .datetime()
        .regex(dateTimeRegex, "createdAt must be RFC3339 / date-time"),
      pageCount: z.number().int().min(1),
      status: z.literal("PREPARED"),
      urgency: z.enum(["STANDARD", "URGENT"]),
    }),

    traceparent: z
      .string()
      .min(1)
      // regex as per JSON schema
      .regex(
        /^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/,
        "traceparent must be valid w3c traceparent",
      ),

    tracestate: z.string().optional(),

    partitionkey: z
      .string()
      .min(1)
      .max(64)
      // regex as per JSON schema
      .regex(/^[a-z0-9-]+$/)
      .optional(),

    recordedtime: z.iso
      .datetime()
      .regex(dateTimeRegex, "recordedtime must be RFC3339 / date-time"),

    sampledrate: z.number().int().min(1).max(9_007_199_254_740_991).optional(),

    sequence: z
      .string()
      // as per JSON schema
      .regex(/^\d{20}$/, "sequence must be a zero-padded 20 digit string")
      .optional(),

    severitytext: z
      .enum(["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"])
      .optional(),

    severitynumber: z.number().int().min(0).max(5),

    dataclassification: z
      .enum(["public", "internal", "confidential", "restricted"])
      .optional(),

    dataregulation: z
      .enum(["GDPR", "HIPAA", "PCI-DSS", "ISO-27001", "NIST-800-53", "CCPA"])
      .optional(),

    datacategory: z
      .enum(["non-sensitive", "standard", "sensitive", "special-category"])
      .optional(),
  })
  .strict();

export type LetterRequestPreparedEvent = z.infer<
  typeof LetterRequestPreparedEventSchema
>;
