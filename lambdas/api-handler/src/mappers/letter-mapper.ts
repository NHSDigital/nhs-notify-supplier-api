import { Letter } from "../../../../internal/datastore";
import { LetterApiDocument } from '../contracts/letter-api';

export function toApiLetter(letter: Letter): LetterApiDocument {
  return {
    data: {
      id: letter.id,
      type: 'Letter',
      attributes: {
        reasonCode: 123, // TODO CCM-11188
        reasonText: 'Reason text', // TODO CCM-11188
        requestedProductionStatus: 'ACTIVE', // TODO CCM-11188
        specificationId: letter.specificationId,
        status: letter.status
      }
    }
  };
}
