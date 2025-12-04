import { z } from "zod";

// eslint-disable-next-line import-x/prefer-default-export
export function EventEnvelope<TData extends z.ZodTypeAny>(
  eventName: string,
  resourceName: string,
  data: TData,
  statuses: readonly string[],
  subjectPrefix?: string,
) {
  const statusRegex = statuses.map((status) => status.toLowerCase()).join("|");
  const subjectPrefixRegex = subjectPrefix
    ? `${subjectPrefix}/[a-z0-9-]+/`
    : "";
  const subjectExamplePrefix = subjectPrefix
    ? `${subjectPrefix}/letter-rendering/`
    : "";

  // Pre-compute type strings to avoid repeated inference
  const typeStrings = statuses.map(
    (status) =>
      `uk.nhs.notify.supplier-api.${resourceName}.${status.toLowerCase()}.v1` as const,
  );

  const schemaExamples = statuses.map(
    (status) =>
      `https://notify.nhs.uk/cloudevents/schemas/supplier-api/${resourceName}.${status.toLowerCase()}.1.0.0.schema.json`,
  );

  return z
    .object({
      specversion: z.literal("1.0").meta({
        title: "CloudEvents spec version",
        description: "CloudEvents specification version (fixed to 1.0).",
        examples: ["1.0"],
      }),

      id: z
        .uuid()
        .min(1)
        .meta({
          title: "Event ID",
          description: "Unique identifier for this event instance (UUID).",
          examples: ["6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111"],
        }),

      type: z.enum(typeStrings as [string, ...string[]]).meta({
        title: `${eventName} event type`,
        description: "Event type using reverse-DNS style",
        examples: typeStrings,
      }),

      dataschema: z
        .string()
        .regex(
          // eslint-disable-next-line security/detect-non-literal-regexp
          new RegExp(
            String.raw`^https://notify\.nhs\.uk/cloudevents/schemas/supplier-api/${resourceName}\.(?<status>${statusRegex})\.1\.\d+\.\d+\.schema.json$`,
          ),
        )
        .meta({
          title: "Data Schema URI",
          description: `URI of a schema that describes the event data\n\nData schema version must match the major version indicated by the type`,
          examples: schemaExamples,
        }),

      source: z
        .string()
        .regex(/^\/data-plane\/supplier-api(?:\/.*)?$/)
        .meta({
          title: "Event Source",
          description:
            "Logical event producer path within the supplier-api domain",
        }),

      subject: z
        .string()

        .regex(new RegExp(`^${subjectPrefixRegex}${resourceName}/[a-z0-9-]+$`))
        .meta({
          title: "Event Subject",
          description:
            "Resource path (no leading slash) within the source made of segments separated by '/'.",
          examples: [
            `${subjectExamplePrefix}${resourceName}/f47ac10b-58cc-4372-a567-0e02b2c3d479`,
          ],
        }),

      data,

      time: z.iso.datetime().meta({
        title: "Event Time",
        description: "Timestamp when the event occurred (RFC 3339).",
        examples: ["2025-10-01T10:15:30.000Z"],
      }),

      datacontenttype: z.optional(
        z.literal("application/json").meta({
          title: "Data Content Type",
          description:
            "Media type for the data field (fixed to application/json).",
          examples: ["application/json"],
        }),
      ),

      traceparent: z
        .string()
        .min(1)
        .regex(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/)
        .meta({
          title: "Traceparent",
          description: "W3C Trace Context traceparent header value.",
          examples: ["00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"],
        }),

      tracestate: z.optional(
        z.string().meta({
          title: "Tracestate",
          description: "Optional W3C Trace Context tracestate header value.",
          examples: ["rojo=00f067aa0ba902b7,congo=t61rcWkgMzE"],
        }),
      ),

      partitionkey: z.optional(
        z
          .string()
          .min(1)
          .max(64)
          .regex(/^[a-z0-9-]+$/)
          .meta({
            title: "Partition Key",
            description:
              "Partition / ordering key (lowercase alphanumerics and hyphen, 1-64 chars).",
            examples: ["customer-920fca11"],
          }),
      ),

      recordedtime: z.iso.datetime().meta({
        title: "Recorded Time",
        description:
          "Timestamp when the event was recorded/persisted (should be >= time).",
        examples: ["2025-10-01T10:15:30.250Z"],
      }),

      sampledrate: z.optional(
        z
          .number()
          .int()
          .min(1)
          .meta({
            title: "Sampled Rate",
            description:
              "Sampling factor: number of similar occurrences this event represents.",
            examples: [5],
          }),
      ),

      sequence: z.optional(
        z
          .string()
          .regex(/^\d{20}$/)
          .meta({
            title: "Sequence",
            description:
              "Zero-padded 20 digit numeric sequence (lexicographically sortable).",
            examples: ["00000000000000000042"],
          }),
      ),

      severitytext: z.optional(
        z.enum(["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"]).meta({
          title: "Severity Text",
          description: "Log severity level name.",
          examples: ["DEBUG"],
        }),
      ),

      severitynumber: z
        .number()
        .int()
        .min(0)
        .max(5)
        .meta({
          title: "Severity Number",
          description:
            "Numeric severity (TRACE=0, DEBUG=1, INFO=2, WARN=3, ERROR=4, FATAL=5).",
          examples: [1],
        }),

      dataclassification: z.optional(
        z.enum(["public", "internal", "confidential", "restricted"]).meta({
          title: "Data Classification",
          description: "Data sensitivity classification.",
          examples: ["restricted"],
        }),
      ),

      dataregulation: z.optional(
        z
          .enum([
            "GDPR",
            "HIPAA",
            "PCI-DSS",
            "ISO-27001",
            "NIST-800-53",
            "CCPA",
          ])
          .meta({
            title: "Data Regulation",
            description: "Regulatory regime tag applied to this data.",
            examples: ["ISO-27001"],
          }),
      ),

      datacategory: z.optional(
        z
          .enum(["non-sensitive", "standard", "sensitive", "special-category"])
          .meta({
            title: "Data Category",
            description:
              "Data category classification (e.g. standard, special-category).",
            examples: ["sensitive"],
          }),
      ),
    })
    .superRefine((obj, ctx) => {
      if (obj.severitytext !== undefined) {
        const mapping = {
          TRACE: 0,
          DEBUG: 1,
          INFO: 2,
          WARN: 3,
          ERROR: 4,
          FATAL: 5,
        };
        if (obj.severitynumber !== mapping[obj.severitytext]) {
          ctx.addIssue({
            code: "custom",
            message: `severitynumber must be ${mapping[obj.severitytext]} when severitytext is ${obj.severitytext}`,
            path: ["severitynumber"],
          });
        }
      }
      if (obj.severitynumber && obj.severitytext === undefined) {
        ctx.addIssue({
          code: "custom",
          message: "severitytext is required when severitynumber is present",
          path: ["severitytext"],
        });
      }
    });
}
