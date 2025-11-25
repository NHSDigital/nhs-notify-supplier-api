import { z } from "zod";
import { EventEnvelope } from "@nhsdigital/nhs-notify-event-schemas-supplier-api/src/events/event-envelope";

describe("EventEnvelope schema validation", () => {
  const $Envelope = EventEnvelope("order.read", "order", z.any(), ["READ"]);
  type Envelope = z.infer<typeof $Envelope>;

  const baseValidEnvelope: Envelope = {
    dataschema:
      "https://notify.nhs.uk/cloudevents/schemas/supplier-api/order.READ.1.0.0.schema.json",
    dataschemaversion: "1.0.0",
    specversion: "1.0",
    id: "6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111",
    source: "/data-plane/supplier-api/ordering",
    subject: "order/769acdd4",
    type: "uk.nhs.notify.supplier-api.order.READ.v1",
    plane: "data-plane",
    time: "2025-10-01T10:15:30.000Z",
    datacontenttype: "application/json",
    data: {
      "notify-payload": {
        "notify-data": { nhsNumber: "9434765919" },
        "notify-metadata": {
          teamResponsible: "Team 1",
          notifyDomain: "Ordering",
          version: "1.3.0",
        },
      },
    },
    traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    recordedtime: "2025-10-01T10:15:30.250Z",
    severitynumber: 2,
    severitytext: "INFO",
  };

  describe("basic validation", () => {
    it("should validate a valid envelope", () => {
      const result = $Envelope.safeParse(baseValidEnvelope);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe("superRefine: severity text and number validation", () => {
    it("should accept TRACE with severitynumber 0", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "TRACE",
        severitynumber: 0,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should accept DEBUG with severitynumber 1", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "DEBUG",
        severitynumber: 1,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should accept INFO with severitynumber 2", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "INFO",
        severitynumber: 2,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should accept WARN with severitynumber 3", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "WARN",
        severitynumber: 3,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should accept ERROR with severitynumber 4", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "ERROR",
        severitynumber: 4,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should accept FATAL with severitynumber 5", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "FATAL",
        severitynumber: 5,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });

    it("should reject TRACE with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "TRACE",
        severitynumber: 1,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject DEBUG with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "DEBUG",
        severitynumber: 2,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject INFO with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "INFO",
        severitynumber: 1,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject WARN with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "WARN",
        severitynumber: 2,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject ERROR with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "ERROR",
        severitynumber: 3,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject FATAL with incorrect severitynumber", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "FATAL",
        severitynumber: 4,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should reject severitynumber without severitytext", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: undefined,
        severitynumber: 2,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should accept severitytext without severitynumber (optional)", () => {
      const envelope = {
        ...baseValidEnvelope,
        severitytext: "INFO",
        severitynumber: 2,
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(true);
    });
  });

  describe("optional fields validation", () => {
    it("should accept envelope with all optional fields", () => {
      const envelope = {
        ...baseValidEnvelope,
        datacontenttype: "application/json",
        tracestate: "rojo=00f067aa0ba902b7",
        partitionkey: "customer-920fca11",
        sampledrate: 5,
        sequence: "00000000000000000042",
        severitytext: "DEBUG",
        severitynumber: 1,
        dataclassification: "restricted",
        dataregulation: "GDPR",
        datacategory: "sensitive",
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should reject invalid source pattern", () => {
      const envelope = {
        ...baseValidEnvelope,
        source: "/invalid-plane/test",
      };

      const result = $Envelope.safeParse(envelope);
      expect(result.success).toBe(false);
    });
  });

  describe("subject prefix validation", () => {
    const $EnvelopeWithPrefix = EventEnvelope(
      "letter.CREATED",
      "letter",
      z.any(),
      ["CREATED"],
      "letter-origin",
    );

    const baseLetterEnvelope = {
      specversion: "1.0" as const,
      id: "6f1c2a53-3d54-4a0a-9a0b-0e02b2c3d479",
      type: "uk.nhs.notify.supplier-api.letter.CREATED.v1" as const,
      plane: "data-plane",
      dataschema:
        "https://notify.nhs.uk/cloudevents/schemas/supplier-api/letter.CREATED.1.0.0.schema.json",
      dataschemaversion: "1.0.0",
      source: "/data-plane/supplier-api/letters",
      time: "2025-10-01T10:15:30.000Z",
      datacontenttype: "application/json",
      data: { status: "CREATED" },
      traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
      recordedtime: "2025-10-01T10:15:30.250Z",
      severitynumber: 2,
      severitytext: "INFO" as const,
    };

    it("should accept subject with valid prefix when prefix is required", () => {
      const envelope = {
        ...baseLetterEnvelope,
        subject:
          "letter-origin/letter-rendering/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      };

      const result = $EnvelopeWithPrefix.safeParse(envelope);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should reject subject without prefix when prefix is required", () => {
      const envelope = {
        ...baseLetterEnvelope,
        subject: "letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      };

      const result = $EnvelopeWithPrefix.safeParse(envelope);
      expect(result.success).toBe(false);
      expect(result?.error?.issues[0].path).toContain("subject");
    });

    it("should reject subject with incomplete prefix", () => {
      const envelope = {
        ...baseLetterEnvelope,
        subject: "letter-origin/letter/f47ac10b-58cc-4372-a567-0e02b2c3d479",
      };

      const result = $EnvelopeWithPrefix.safeParse(envelope);
      expect(result.success).toBe(false);
    });

    it("should accept subject without prefix when no prefix is specified", () => {
      const $EnvelopeNoPrefix = EventEnvelope("order.READ", "order", z.any(), [
        "READ",
      ]);

      const envelope = {
        specversion: "1.0" as const,
        id: "6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111",
        type: "uk.nhs.notify.supplier-api.order.READ.v1" as const,
        plane: "data-plane",
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-api/order.READ.1.0.0.schema.json",
        dataschemaversion: "1.0.0",
        source: "/data-plane/supplier-api/ordering",
        subject: "order/769acdd4",
        time: "2025-10-01T10:15:30.000Z",
        datacontenttype: "application/json",
        data: { status: "READ" },
        traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
        recordedtime: "2025-10-01T10:15:30.250Z",
        severitynumber: 2,
        severitytext: "INFO" as const,
      };

      const result = $EnvelopeNoPrefix.safeParse(envelope);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should accept various prefix formats", () => {
      const $EnvelopeMultiSegmentPrefix = EventEnvelope(
        "letter.CREATED",
        "letter",
        z.any(),
        ["CREATED"],
        "a/b",
      );

      const envelope = {
        ...baseLetterEnvelope,
        subject: "a/b/c/letter/test-id-123",
      };

      const result = $EnvelopeMultiSegmentPrefix.safeParse(envelope);
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
    });

    it("should reject subject with prefix when no prefix is required", () => {
      const $EnvelopeNoPrefix = EventEnvelope("order.read", "order", z.any(), [
        "READ",
      ]);

      const envelope = {
        specversion: "1.0" as const,
        id: "6f1c2a53-3d54-4a0a-9a0b-0e9ae2d4c111",
        type: "uk.nhs.notify.supplier-api.order.read.v1" as const,
        dataschema:
          "https://notify.nhs.uk/cloudevents/schemas/supplier-api/order.read.1.0.0.schema.json",
        source: "/data-plane/supplier-api/ordering",
        subject: "prefix/letter-rendering/order/769acdd4",
        time: "2025-10-01T10:15:30.000Z",
        data: { status: "READ" },
        traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
        recordedtime: "2025-10-01T10:15:30.250Z",
        severitynumber: 2,
        severitytext: "INFO" as const,
      };

      const result = $EnvelopeNoPrefix.safeParse(envelope);
      expect(result.success).toBe(false);
    });
  });
});
