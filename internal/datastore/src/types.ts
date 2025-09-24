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

export const LetterStatus = z.enum([
  'PENDING', 'ACCEPTED', 'REJECTED', 'PRINTED',
  'ENCLOSED', 'CANCELLED', 'DISPATCHED', 'FAILED',
  'RETURNED', 'DESTROYED', 'FORWARDED', 'DELIVERED']);

export const LetterSchemaBase = z.object({
  id: z.string(),
  status: LetterStatus,
  specificationId: z.string(),
  groupId: z.string(),
  reasonCode: z.number().optional(),
  reasonText: z.string().optional()
});

export const LetterSchema = LetterSchemaBase.extend({
  supplierId: z.string(),
  url: z.url(),
  createdAt: z.string(),
  updatedAt: z.string(),
  supplierStatus: z.string().describe('Secondary index PK'),
  supplierStatusSk: z.string().describe('Secondary index SK'),
  ttl: z.int(),
}).describe('Letter');

/**
 * Letter is the type used for storing letters in the database.
 * The supplierStatus is a composite key combining supplierId and status.
 * The ttl is used for automatic deletion of old letters.
 */
export type Letter = z.infer<typeof LetterSchema>;
export type LetterBase = z.infer<typeof LetterSchemaBase>;

export const MISchema = z.object({
  id: z.string(),
  supplierId: idRef(SupplierSchema),
  specificationId: z.string(),
  groupId: z.string(),
  lineItem: z.string(),
  quantity: z.number(),
  stockRemaining: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
}).describe('MI');

export type MI = z.infer<typeof MISchema>;
