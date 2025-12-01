import { z } from 'zod';
import { makeCollectionSchema, makeDocumentSchema } from './json-api';

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
  'FORWARDED',
  'DELIVERED'
]);

export const UpdateLetterSchema = z
  .object({
    id: z.string(),
    supplierId: z.string(),
    status: LetterStatusSchema,
    reasonCode: z.string().optional(),
    reasonText: z.string().optional(),
  })
  .strict();

export type UpdateLetterCommand = z.infer<typeof UpdateLetterSchema>;

export const PatchLetterRequestResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Letter'),
  attributes: z.object({
    status: LetterStatusSchema,
    reasonCode: z.string().optional(),
    reasonText: z.string().optional(),
  }).strict()
}).strict();

export const GetLetterResponseResourceSchema = z.object({
  id: z.string(),
  type: z.literal('Letter'),
  attributes: z.object({
    status: LetterStatusSchema,
    specificationId: z.string(),
    groupId: z.string().optional(),
    reasonCode: z.string().optional(),
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

export const PatchLetterResponseResourceSchema = GetLetterResponseResourceSchema;

export type LetterStatus = z.infer<typeof LetterStatusSchema>;

export const PatchLetterRequestSchema = makeDocumentSchema(PatchLetterRequestResourceSchema);
export const PatchLetterResponseSchema = makeDocumentSchema(PatchLetterResponseResourceSchema);
export const PostLettersRequestSchema = makeCollectionSchema(PatchLetterRequestResourceSchema);
export const GetLetterResponseSchema = makeDocumentSchema(GetLetterResponseResourceSchema);
export const GetLettersResponseSchema = makeCollectionSchema(GetLettersResponseResourceSchema);

export type PostLettersRequestResource = z.infer<typeof PatchLetterRequestResourceSchema>;

export type PatchLetterRequest = z.infer<typeof PatchLetterRequestSchema>;
export type PatchLetterResponse = z.infer<typeof PatchLetterResponseSchema>;
export type PostLettersRequest = z.infer<typeof PostLettersRequestSchema>;
export type GetLetterResponse = z.infer<typeof GetLetterResponseSchema>;
export type GetLettersResponse = z.infer<typeof GetLettersResponseSchema>;
