import { z } from "zod";
import { getEntityName } from "zod-mermaid";

/**
 * Vendored from zod-mermaid to avoid a production dependency on that package.
 *
 * Creates a field that references another entity by ID, inferring the type from the referenced
 * schema's id field.
 * This allows you to indicate relationships without embedding the full entity.
 *
 * @param schema - The Zod object schema representing the referenced entity
 * @param idFieldName - The name of the ID field in the referenced schema (default: 'id')
 * @param entityName - Optional custom name for the referenced entity
 * @returns A Zod schema for the ID field with reference metadata, with the type inferred from
 * the referenced schema
 *
 * @example
 * import { z } from 'zod';
 * import { idRef } from './id-ref';
 *
 * const CustomerSchema = z.object({ id: z.string() });
 * const OrderSchema = z.object({
 *   id: z.string(),
 *   customerId: idRef(CustomerSchema), // Inferred as ZodString
 * });
 */
// Overload for when a specific ID field is provided
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>>,
  K extends keyof T["shape"] & string,
>(schema: T, idFieldName: K, entityName?: string): T["shape"][K];

// Overload for when using the default "id" field
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>> & {
    shape: { id: z.ZodTypeAny };
  },
>(schema: T, idFieldName?: undefined, entityName?: string): T["shape"]["id"];

// Implementation
export function idRef<
  T extends z.ZodObject<Record<string, z.ZodTypeAny>>,
  K extends keyof T["shape"] & string = "id",
>(schema: T, idFieldName?: K, entityName?: string): T["shape"][K] {
  const { shape } = schema;
  const field = idFieldName ?? "id";

  // Get the ID field schema
  // eslint-disable-next-line security/detect-object-injection
  const idFieldSchema = shape[field];
  if (!idFieldSchema) {
    throw new Error(`ID field '${field}' not found in schema`);
  }

  // Use the provided entity name or the schema description
  const targetEntityName =
    entityName || getEntityName(schema, z.globalRegistry) || "Entity";

  // Create a new schema with the same type and validation as the ID field
  const resultSchema = idFieldSchema.clone().meta({
    title: `${targetEntityName} ID Reference`,
    description: `Reference to a ${targetEntityName} by its unique identifier`,
    targetEntityName,
  });

  return resultSchema as T["shape"][K];
}
