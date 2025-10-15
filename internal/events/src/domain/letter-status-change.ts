import { z } from 'zod';
import { DomainBase } from '@internal/helpers'

/**
 * Status values for letters in the supplier-api domain
 */
export const $LetterStatus = z.enum([
  'PENDING', 'ACCEPTED', 'REJECTED', 'PRINTED',
  'ENCLOSED', 'CANCELLED', 'DISPATCHED', 'FAILED',
  'RETURNED', 'FORWARDED', 'DELIVERED']);

export type LetterStatus = z.infer<typeof $LetterStatus>;

/**
 * Schema for letter status change events
 */
export const $LetterStatusChange = DomainBase('LetterStatusChange').extend({
  sourceSubject: z.string(),
  status: $LetterStatus,
  reasonCode: z.string().optional(),
  reasonText: z.string().optional(),
});

export type LetterStatusChange = z.infer<typeof $LetterStatusChange>;
