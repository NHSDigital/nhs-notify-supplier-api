import z from "zod";

export const $BankHolidays = z.object({
  "england-and-wales": z.object({
    events: z.array(
      z.object({
        date: z.iso.date(),
      }),
    ),
  }),
});

export type BankHolidays = z.infer<typeof $BankHolidays>;
