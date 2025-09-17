import { LetterBase } from "../../../../internal/datastore";
import { LetterApiDocument, LetterApiDocumentSchema, LetterApiResource, LetterApiResourceSchema } from '../contracts/letter-api';

export function mapLetterBaseToApiDocument(letterBase: LetterBase): LetterApiDocument {
  return LetterApiDocumentSchema.parse({
    data: mapLetterBaseToApiResource(letterBase)
  });
}

export function mapLetterBaseToApiResource(letterBase: LetterBase): LetterApiResource {
  return LetterApiResourceSchema.parse({
    id: letterBase.id,
    type: 'Letter',
    attributes: {
      status: letterBase.status,
      specificationId: letterBase.specificationId,
      groupId: letterBase.groupId,
      ...(letterBase.reasonCode && { reasonCode: letterBase.reasonCode }),
      ...(letterBase.reasonText && { reasonText: letterBase.reasonText })
    }
  });
}
