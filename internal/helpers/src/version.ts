import { z } from 'zod';

/**
 * Semantic version (major.minor.patch) with numeric segments only.
 * Branded for nominal typing.
 */
export const $Version = z
  .string()
  .regex(/^[0-9]+\.[0-9]+\.[0-9]+$/)
  .brand('Version');

export type Version = z.infer<typeof $Version>;
