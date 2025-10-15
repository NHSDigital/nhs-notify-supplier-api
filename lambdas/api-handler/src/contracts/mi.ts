import z from "zod";
import { makeDocumentSchema } from "./json-api";

export const PostMIRequestResourceSchema = z.object({
  type: z.literal('ManagementInformation'),
  attributes: z.object({
    lineItem: z.string(),
    timestamp: z.string(),
    quantity: z.number(),
    specificationId: z.string().optional(),
    groupId: z.string().optional(),
    stockRemaining: z.number().optional(),
  }).strict()
}).strict();

export const PostMIResponseResourceSchema = z.object({
  type: z.literal('ManagementInformation'),
  id: z.string(),
  attributes: z.object({
    lineItem: z.string(),
    timestamp: z.string(),
    quantity: z.number(),
    specificationId: z.string().optional(),
    groupId: z.string().optional(),
    stockRemaining: z.number().optional(),
  }).strict()
}).strict();

export const PostMIRequestSchema = makeDocumentSchema(PostMIRequestResourceSchema);
export const PostMIResponseSchema = makeDocumentSchema(PostMIResponseResourceSchema);

export type PostMIRequest = z.infer<typeof PostMIRequestSchema>;
export type PostMIResponse = z.infer<typeof PostMIResponseSchema>;

export type IncomingMI = PostMIRequest['data']['attributes'] & {supplierId: string};
