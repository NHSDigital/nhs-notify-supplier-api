import { z } from "zod";

export function DomainBase<T extends string>(
  type: T,
): z.ZodObject<{ domainId: z.core.$ZodBranded<z.ZodString, T> }> {
  const idType = z
    .string()
    .brand<T>(type)
    .meta({
      title: `${type} ID`,
      description: `Unique identifier for the ${type}`,
      examples: ["1y3q9v1zzzz"],
    }) as z.core.$ZodBranded<z.ZodString, T>;

  return z.object({
    domainId: idType,
  });
}
