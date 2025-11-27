import { z } from "zod";

/**
 * Semantic version (major.minor.patch) with numeric segments only.
 * Branded for nominal typing.
 */
export const $Version = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/)
  .brand("Version");

export type Version = z.infer<typeof $Version>;
