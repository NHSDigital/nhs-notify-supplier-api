import { z } from "zod";

export const $Constraint = z
  .object({
    value: z.number(),
    operator: z
      .enum(["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN"])
      .default("LESS_THAN"),
  })
  .meta({
    title: "Constraint",
  });
export type Constraint = z.infer<typeof $Constraint>;

export const $Constraints = z.object({
  deliveryDays: $Constraint.optional().meta({
    title: "Delivery Days",
    description:
      "The expected number of days for delivery under this configuration.",
  }),
  sheets: $Constraint.optional().meta({
    title: "Sheets of paper",
    description:
      "The number of sheets that can be accommodated with this configuration.",
  }),
  sides: $Constraint.optional().meta({
    title: "Sides",
    description:
      "The number of sides to be printed for this letter. Dependent on duplex printing options.",
  }),
  blackCoveragePercentage: $Constraint.optional().meta({
    title: "Black Coverage Percentage",
    description:
      "The percentage of black coverage allowed on the paper under this configuration.",
  }),
  colourCoveragePercentage: $Constraint.optional().meta({
    title: "Colour Coverage Percentage",
    description:
      "The percentage of colour coverage allowed on the paper under this configuration.",
  }),
});
