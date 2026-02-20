import { z } from "zod";

export const $Postage = z
  .object({
    id: z.string(),
    size: z.enum(["STANDARD", "LARGE", "PARCEL"]),
    deliveryDays: z.number().optional().meta({
      title: "Delivery Days",
      description:
        "The expected number of days for delivery under this postage option.",
    }),
    maxWeightGrams: z
      .number()
      .optional()
      .meta({
        title: "Max Weight (grams)",
        description:
          "The maximum weight in grams for this postage option. Places a " +
          "constraint based on the number of sheets and paper weight.",
      }),
    maxThicknessMm: z
      .number()
      .optional()
      .meta({
        title: "Max Thickness (mm)",
        description:
          "The maximum thickness in millimetres for this postage option. " +
          "Places a constraint based on the number of sheets and paper type.",
      }),
  })
  .describe("Postage");
export type Postage = z.infer<typeof $Postage>;
