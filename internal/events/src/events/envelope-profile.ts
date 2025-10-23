import { z } from "zod";

export const $EnvelopeProfile = z
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
    source: z
      .string()
      .min(12)
      .regex(/^\/(data-plane|control-plane)(?:\/[a-z0-9-]+)*$/)
      .meta({
        title: "Event Source",
        description:
          "Logical event producer path starting /data-plane or /control-plane followed by lowercase segments.",
        examples: ["/data-plane/ordering", "/control-plane/audit"],
      }),
    subject: z
      .string()
      .min(5)
      .regex(/^[^\/]+(\/[^\/]+)*$/)
      .meta({
        title: "Event Subject",
        description:
          "Resource path (no leading slash) within the source made of segments separated by '/'.",
        examples: [
          "origin/920fca11-596a-4eca-9c47-99f624614658/order/769acdd4-6a47-496f-999f-76a6fd2c3959/item/4f5e17c0-ec57-4cee-9a86-14580cf5af7d",
        ],
      }),
    type: z
      .string()
      .min(1)
      .regex(
        // eslint-disable-next-line sonarjs/regex-complexity
        /^(?!.*(?:^|\.|\/)(completed|finished|updated|changed|processed|handled|status|started|failed)(?:\.|\/|$))uk\.nhs\.notify\.[a-z0-9]+(\.[a-z0-9]+)*$/,
        {
          message:
            "Event type must match uk.nhs.notify.* and must not contain any of: completed, finished, updated, changed, processed, handled, status, started, failed.",
        },
      )
      .meta({
        title: "Event Type",
        description:
          "Event type (uk.nhs.notify.*) using reverse-DNS style; ambiguous verbs (completed, finished, updated, changed, processed, handled, status, started, failed) disallowed.",
        examples: ["uk.nhs.notify.ordering.order.read"],
      }),
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
    dataschema: z.optional(
      z.string().meta({
        title: "Data Schema URI",
        description:
          "URI of a schema that describes the event payload (notify-payload).",
        examples: [
          "https://nhsdigital.github.io/nhs-notify-standards/cloudevents/nhs-notify-example-event-data.schema.json",
        ],
      }),
    ),
    data: z.record(z.string(), z.unknown()).meta({
      title: "Event Data",
      description: "Container object wrapping the structured Notify payload.",
      examples: [
        {
          "notify-payload": {
            "notify-data": { nhsNumber: "9434765919" },
            "notify-metadata": {
              teamResponsible: "Team 1",
              notifyDomain: "Ordering",
              version: "1.3.0",
            },
          },
        },
      ],
    }),
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
        .enum(["GDPR", "HIPAA", "PCI-DSS", "ISO-27001", "NIST-800-53", "CCPA"])
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
    if (
      /^\/data-plane/.test(obj.source) &&
      // eslint-disable-next-line sonarjs/regex-complexity
      !/^[a-z0-9-]+(\/[^/]+)+$/.test(
        obj.subject,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "For /data-plane sources, subject must start with a {namespace}/{id} and may have further segments separated by '/'.",
        path: ["subject"],
      });
    }
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

export type EnvelopeProfile = z.infer<typeof $EnvelopeProfile>;
