import { z } from "zod";

export const $ChannelType = z.enum(["NHSAPP", "SMS", "EMAIL", "LETTER"]);

export type ChannelType = z.infer<typeof $ChannelType>;
