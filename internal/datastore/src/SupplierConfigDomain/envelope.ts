import { z } from "zod";

export const $EnvelopeFeature = z.enum([
  "WHITEMAIL",
  "NHS_BRANDING",
  "NHS_BARCODE",
]);

export const $Envelope = z
  .object({
    id: z.string(),
    name: z.string(),
    size: z.enum(["C5", "C4", "DL"]),
    features: z.array($EnvelopeFeature).optional(),
    artwork: z.url().optional().meta({
      title: "Artwork URL",
      description:
        "An S3 URL pointing to the artwork for this envelope, if applicable.",
    }),
    maxThicknessMm: z
      .number()
      .optional()
      .meta({
        title: "Max Thickness (mm)",
        description:
          "The maximum thickness in millimetres for this envelope. " +
          "Used to validate that the assembled pack will fit within the envelope.",
      }),
    maxSheets: z
      .number()
      .optional()
      .meta({
        title: "Max Sheets",
        description:
          "The maximum number of sheets that can be accommodated within this envelope. " +
          "Used to validate that the assembled pack will fit within the envelope.",
      }),
  })
  .describe("Envelope");
export type Envelope = z.infer<typeof $Envelope>;
