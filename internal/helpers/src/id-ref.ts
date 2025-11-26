import { z } from "zod";

/**
 * Creates a field that references another entity by ID, inferring the type from the referenced
 * schema's domainId field.
 * This allows you to indicate relationships without embedding the full entity.
 *
 * @param schema - The Zod object schema representing the referenced entity
 * @param idFieldName - The name of the ID field in the referenced schema (default: 'domainId')
 * @param entityName - Optional custom name for the referenced entity
 * @returns A Zod schema for the ID field with reference metadata, with the type inferred from
 * the referenced schema
 *
 * @example
 * import { z } from 'zod';
 * import { idRef } from './id-ref';
 *
 * const CustomerSchema = z.object({ domainId: z.string() });
 * const OrderSchema = z.object({
 *   domainId: z.string(),
 *   customerId: idRef(CustomerSchema), // Inferred as ZodString
 * });
 */
// Overload for when a specific ID field is provided
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>>,
  K extends keyof T["shape"] & string,
>(schema: T, idFieldName: K, entityName?: string): T["shape"][K];

// Overload for when using the default "domainId" field
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>> & {
    shape: { domainId: z.ZodTypeAny };
  },
>(
  schema: T,
  idFieldName?: undefined,
  entityName?: string,
): T["shape"]["domainId"];

// Implementation
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>>,
  K extends keyof T["shape"] & string = "domainId",
>(schema: T, idFieldName?: K, entityName?: string): T["shape"][K] {
  const { shape } = schema;
  const field = idFieldName ?? "domainId";

  if (!(field in shape)) {
    throw new Error(`ID field '${field}' not found in schema`);
  }

  // Get the ID field schema
  const idFieldSchema = shape[field];
  if (!idFieldSchema) {
    throw new Error(`ID field '${field}' not found in schema`);
  }

  // Use the provided entity name or the schema description
  const targetEntityName = entityName || schema.description || "Unknown";

  // Create a new schema with the same type and validation as the ID field
  const resultSchema = idFieldSchema.clone().meta({
    title: `${targetEntityName} ID Reference`,
    description: `Reference to a ${targetEntityName} by its unique identifier`,
  });

  return resultSchema as T["shape"][K];
}
