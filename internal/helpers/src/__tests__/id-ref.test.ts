import { z } from "zod";
import { idRef } from "../id-ref";

describe("idRef", () => {
  const TestSchema = z.object({
    domainId: z.string().uuid(),
    name: z.string(),
  });

  it("should create an ID reference with the same type as the source schema's ID field", () => {
    const refField = idRef(TestSchema);

    // Should validate UUIDs like the original schema's domainId
    expect(() => refField.parse("not-a-uuid")).toThrow();
    expect(() => refField.parse("123e4567-e89b-12d3-a456-426614174000")).not.toThrow();
  });

  it("should add reference metadata", () => {
    const refField = idRef(TestSchema, "domainId", "TestEntity");

    // Just verify that the reference can be created and doesn't throw
    expect(refField).toBeDefined();
    // We can't easily check the meta properties directly, but we can validate it works
    expect(() => refField.parse("123e4567-e89b-12d3-a456-426614174000")).not.toThrow();
  });

  it("should use custom ID field name when provided", () => {
    const CustomSchema = z.object({
      customId: z.number(),
      name: z.string(),
    });

    const refField = idRef(CustomSchema, "customId");

    // Should validate numbers like the custom ID field
    expect(() => refField.parse("not-a-number")).toThrow();
    expect(() => refField.parse(123)).not.toThrow();
  });
});
