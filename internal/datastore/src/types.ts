import { z } from 'zod';
import { idRef } from '@internal/helpers';

export const SupplierStatus = z.enum(['ENABLED', 'DISABLED']);

export const SupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  apimId: z.string(),
  status: SupplierStatus,
  updatedAt: z.string(),
}).describe('Supplier');

export type Supplier = z.infer<typeof SupplierSchema>;

export const LetterStatus = z.enum([
  'PENDING', 'ACCEPTED', 'REJECTED', 'PRINTED',
  'ENCLOSED', 'CANCELLED', 'DISPATCHED', 'FAILED',
  'RETURNED', 'FORWARDED', 'DELIVERED']);

export type LetterStatusType = z.infer<typeof LetterStatus>;

export const LetterSchemaBase = z.object({
  id: z.string(),
  status: LetterStatus,
  specificationId: z.string(),
  groupId: z.string(),
  reasonCode: z.string().optional(),
  reasonText: z.string().optional()
});

export const LetterSchema = LetterSchemaBase.extend({
  supplierId: idRef(SupplierSchema, 'id'),
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

export const MISchemaBase = z.object({
  id: z.string(),
  lineItem: z.string(),
  timestamp: z.string(),
  quantity: z.number(),
  specificationId: z.string().optional(),
  groupId: z.string().optional(),
  stockRemaining: z.number().optional()
});

export const MISchema = MISchemaBase.extend({
  supplierId: idRef(SupplierSchema, 'id'),
  createdAt: z.string(),
  updatedAt: z.string(),
  ttl: z.int(),
}).describe('MI');

export type MI = z.infer<typeof MISchema>;
export type MIBase = z.infer<typeof MISchemaBase>;
