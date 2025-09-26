import { LetterBase } from "../../../../internal/datastore";
import { LetterApiDocument, LetterApiDocumentSchema, LetterApiResource, LetterApiResourceSchema } from '../contracts/letter-api';

export function mapLetterBaseToApiDocument(letterBase: LetterBase, opts: { excludeOptional: boolean } = { excludeOptional: false }): LetterApiDocument {
  return LetterApiDocumentSchema.parse({
    data: mapLetterBaseToApiResource(letterBase, opts)
  });
}

export function mapLetterBaseToApiResource(letterBase: LetterBase, opts: { excludeOptional: boolean } = { excludeOptional: false }): LetterApiResource {
  return LetterApiResourceSchema.parse({
    id: letterBase.id,
    type: 'Letter',
    attributes: {
      status: letterBase.status,
      specificationId: letterBase.specificationId,
      groupId: letterBase.groupId,
      ...(letterBase.reasonCode && !opts.excludeOptional && { reasonCode: letterBase.reasonCode }),
      ...(letterBase.reasonText && !opts.excludeOptional && { reasonText: letterBase.reasonText })
    }
  });
}
