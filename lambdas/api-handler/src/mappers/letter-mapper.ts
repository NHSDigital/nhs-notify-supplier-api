import { LetterBase } from "../../../../internal/datastore";
import { LetterApiDocument, LetterApiResource } from '../contracts/letter-api';

export function mapLetterBaseToApiDocument(letterBase: LetterBase): LetterApiDocument {
  return {
    data: {
      id: letterBase.id,
      type: 'Letter',
      attributes: {
        reasonCode: 123, // TODO CCM-11188
        reasonText: 'Reason text', // TODO CCM-11188
        specificationId: letterBase.specificationId,
        status: letterBase.status,
        groupId: letterBase.groupId
      }
    }
  };
}

export function mapLetterBaseToApiResource(letterBase: LetterBase): LetterApiResource {
  return {
      id: letterBase.id,
      type: 'Letter',
      attributes: {
        reasonCode: 123, // TODO CCM-11188
        reasonText: 'Reason text', // TODO CCM-11188
        specificationId: letterBase.specificationId,
        status: letterBase.status,
        groupId: letterBase.groupId
      }
  };
}
