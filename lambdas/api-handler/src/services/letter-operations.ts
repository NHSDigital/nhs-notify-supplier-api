import { LetterBase, LetterRepository } from '../../../../internal/datastore/src'
import { NotFoundError, ValidationError } from '../errors';
import { LetterApiResource, LetterApiDocument } from '../contracts/letter-api';
import { mapLetterBaseToApiDocument } from '../mappers/letter-mapper';
import { ApiErrorDetail } from '../contracts/errors';


export const getLettersForSupplier = async (supplierId: string, status: string, limit: number, letterRepo: LetterRepository): Promise<LetterBase[]> => {

  return await letterRepo.getLettersBySupplier(supplierId, status, limit);
}

export const patchLetterStatus = async (letterToUpdate: LetterApiResource, letterId: string, supplierId: string, letterRepo: LetterRepository): Promise<LetterApiDocument> => {

  if (letterToUpdate.id !== letterId) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);
  }

  let updatedLetter;

  try {
    updatedLetter =  await letterRepo.updateLetterStatus(supplierId, letterId, letterToUpdate.attributes.status,
      letterToUpdate.attributes.reasonCode, letterToUpdate.attributes.reasonText);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }

  return mapLetterBaseToApiDocument(updatedLetter);
}
