import { z } from "zod";

export const $Paper = z
  .object({
    id: z.string(),
    name: z.string(),
    weightGSM: z.number(),
    size: z.enum(["A5", "A4", "A3"]),
    colour: z.enum(["WHITE"]).meta({
      title: "Colour",
      description:
        "The colour of the paper. Currently we only define WHITE paper, but this may be extended in future.",
    }),
    finish: z.enum(["MATT", "GLOSSY", "SILK"]).optional(),
    recycled: z.boolean(),
  })
  .describe("Paper");
export type Paper = z.infer<typeof $Paper>;
