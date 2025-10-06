import { LetterBase, LetterRepository } from '../../../../internal/datastore/src'
import { NotFoundError, ValidationError } from '../errors';
import { LetterDto, PatchLetterResponse } from '../contracts/letters';
import { mapToPatchLetterResponse } from '../mappers/letter-mapper';
import { ApiErrorDetail } from '../contracts/errors';


export const getLettersForSupplier = async (supplierId: string, status: string, limit: number, letterRepo: LetterRepository): Promise<LetterBase[]> => {

  return await letterRepo.getLettersBySupplier(supplierId, status, limit);
}

export const patchLetterStatus = async (letterToUpdate: LetterDto, letterId: string, letterRepo: LetterRepository): Promise<PatchLetterResponse> => {

  if (letterToUpdate.id !== letterId) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);
  }

  let updatedLetter;

  try {
    updatedLetter =  await letterRepo.updateLetterStatus(letterToUpdate);
  } catch (error) {
    if (error instanceof Error && /^Letter with id \w+ not found for supplier \w+$/.test(error.message)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }

  return mapToPatchLetterResponse(updatedLetter);
}

export const getLetterData = async (supplierId: string, letterId: string, letterRepo: LetterRepository): Promise<LetterBase> => {

  let letter;

  try {
    letter = await letterRepo.getLetterById(supplierId, letterId);
  } catch (error) {
    if (error instanceof Error && /^Letter with id \w+ not found for supplier \w+$/.test(error.message)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }


}
