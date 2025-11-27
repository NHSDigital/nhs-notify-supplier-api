import { z } from "zod";
import { idRef } from "../id-ref";

describe("idRef", () => {
  const TestSchema = z.object({
    domainId: z.uuid(),
    name: z.string(),
  });

  it("should create an ID reference with the same type as the source schema's ID field", () => {
    const refField = idRef(TestSchema);

    // Should validate UUIDs like the original schema's domainId
    expect(() => refField.parse("not-a-uuid")).toThrow();
    expect(() =>
      refField.parse("123e4567-e89b-12d3-a456-426614174000"),
    ).not.toThrow();
  });

  it("should add reference metadata", () => {
    const refField = idRef(TestSchema, "domainId", "TestEntity");

    expect(refField).toBeDefined();
    expect(z.globalRegistry.has(refField)).toBe(true);
    expect(z.globalRegistry.get(refField)).toEqual(
      expect.objectContaining({
        title: "TestEntity ID Reference",
        description: "Reference to a TestEntity by its unique identifier",
      }),
    );
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
