import { Letter } from "../../../../internal/datastore";
import { LetterApiDocument } from '../contracts/letter-api';

export function toApiLetter(letter: Letter): LetterApiDocument {
  return {
    data: {
      id: letter.id,
      type: 'Letter',
      attributes: {
        reasonCode: 123, // TODO CCM-11188: map from DB if stored
        reasonText: 'Reason text', // TODO CCM-11188: map from DB if stored
        requestedProductionStatus: 'ACTIVE', // TODO CCM-11188: map from DB if stored
        status: letter.status
      }
    }
  };
}
