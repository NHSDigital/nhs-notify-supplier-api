import { z } from "zod";

export const $Insert = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["FLYER", "BOOKLET", "ATTACHMENT"]),
    source: z.enum(["IN_HOUSE", "EXTERNAL"]),
    artwork: z.url().optional().meta({
      title: "Artwork URL",
      description:
        "An S3 URL pointing to the artwork for this insert, if applicable.",
    }),
    weightGrams: z.number().optional().meta({
      title: "Weight (grams)",
      description:
        "The weight in grams of this insert. Used to calculate postage options.",
    }),
  })
  .describe("Insert");
export type Insert = z.infer<typeof $Insert>;
