import { z } from 'zod';
import { makeCollectionSchema, makeDocumentSchema } from './json-api';

export type LetterDto = {
  id: string,
  status: LetterStatus,
  supplierId: string,
  specificationId?: string,
  groupId?: string,
  reasonCode?: number,
  reasonText?: string
};

export const LetterStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'PRINTED',
  'ENCLOSED',
  'CANCELLED',
  'DISPATCHED',
  'FAILED',
  'RETURNED',
  'DESTROYED',
  'FORWARDED',
  'DELIVERED'
]);

export const PatchLetterRequestResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Letter'),
  attributes: z.object({
    status: LetterStatusSchema,
    reasonCode: z.number().optional(),
    reasonText: z.string().optional(),
  }).strict()
}).strict();

export const PatchLetterResponseResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Letter'),
  attributes: z.object({
    status: LetterStatusSchema,
    specificationId: z.string(),
    groupId: z.string().optional(),
    reasonCode: z.number().optional(),
    reasonText: z.string().optional(),
  }).strict()
}).strict();

export const GetLettersResponseResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Letter'),
  attributes: z.object({
    status: LetterStatusSchema,
    specificationId: z.string(),
    groupId: z.string().optional(),
  }).strict()
}).strict();

export type LetterStatus = z.infer<typeof LetterStatusSchema>;

export const PatchLetterRequestSchema = makeDocumentSchema(PatchLetterRequestResourceSchema);
export const PatchLetterResponseSchema = makeDocumentSchema(PatchLetterResponseResourceSchema);
export const GetLettersResponseSchema = makeCollectionSchema(GetLettersResponseResourceSchema);

export type PatchLetterRequest = z.infer<typeof PatchLetterRequestSchema>;
export type PatchLetterResponse = z.infer<typeof PatchLetterResponseSchema>;
export type GetLettersResponse = z.infer<typeof GetLettersResponseSchema>;
