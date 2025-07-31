import { z } from 'zod';
import { idRef } from 'zod-mermaid';

export const SupplerStatus = z.enum(['ENABLED', 'DISABLED']);

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  apimId: z.string(),
  status: SupplerStatus
}).describe('Supplier');

export type Supplier = z.infer<typeof SupplierSchema>;
export type SupplierId = Supplier['id'];

export const LetterStatus = z.enum([
  'PENDING', 'ACCEPTED', 'DISPATCHED', 'FAILED',
  'REJECTED', 'DELIVERED', 'CANCELLED']);

export const LetterSchema = z.object({
  supplierId: idRef(SupplierSchema),
  id: z.string(),
  url: z.url(),
  status: LetterStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
}).describe('Letter');

export type Letter = z.infer<typeof LetterSchema>;
export type LetterId = Letter['id'];

export const LetterDBSchema = LetterSchema.extend({
  supplierStatus: z.string().describe('Secondary index PK'),
});

/**
 * LetterDB is the type used for storing letters in the database.
 * It extends the LetterSchema with a secondary index for supplierStatus.
 */
export type LetterDB = z.infer<typeof LetterDBSchema>;
