import { z } from "zod";
import { $ChannelType } from "./channel";
import { $EnvironmentStatus } from "./common";

export const $Supplier = z
  .object({
    id: z.string(),
    name: z.string(),
    channelType: $ChannelType,
    dailyCapacity: z.number().int(),
    status: $EnvironmentStatus,
  })
  .describe("Supplier");

export type Supplier = z.infer<typeof $Supplier>;
