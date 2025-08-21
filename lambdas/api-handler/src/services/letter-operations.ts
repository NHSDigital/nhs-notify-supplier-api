import { LetterRepository } from '../../../../internal/datastore/src'
import { NotFoundError, ValidationError } from '../errors';
import { LetterApiResource, LetterApiDocument } from '../contracts/letter-api';
import { toApiLetter } from '../mappers/letter-mapper';
import { ApiErrorDetail } from '../contracts/errors';


export const getLetterIdsForSupplier = async (supplierId: string, letterRepo: LetterRepository): Promise<string[]> => {

  return await letterRepo.getLetterIdsBySupplier(supplierId);
}

export const patchLetterStatus = async (letterToUpdate: LetterApiResource, letterId: string, supplierId: string, letterRepo: LetterRepository): Promise<LetterApiDocument> => {

  if (letterToUpdate.id !== letterId) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);
  }

  try {
    const updatedLetter =  await letterRepo.updateLetterStatus(supplierId, letterId, letterToUpdate.attributes.status);

    return toApiLetter(updatedLetter);

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }
}
