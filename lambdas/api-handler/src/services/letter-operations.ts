import { LetterRepository } from '../../../../internal/datastore/src'
import { NotFoundError, ValidationError } from '../errors';
import { LetterApiResource, LetterApiDocument } from '../contracts/letter-api';
import { toApiLetter } from '../mappers/letter-mapper';


export const getLettersForSupplier = async (supplierId: string, status: string, size: number, letterRepo: LetterRepository, cursor?: string): Promise<string[]> => {

  return await letterRepo.getLettersBySupplier(supplierId, status, size, cursor);
}

export const patchLetterStatus = async (letterToUpdate: LetterApiResource, letterId: string, supplierId: string, letterRepo: LetterRepository): Promise<LetterApiDocument> => {

  if (letterToUpdate.id !== letterId) {
    throw new ValidationError("Bad Request: Letter ID in body does not match path parameter");
  }

  try {
    const updatedLetter =  await letterRepo.updateLetterStatus(supplierId, letterId, letterToUpdate.attributes.status);

    return toApiLetter(updatedLetter);

  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(`Not Found: Letter with ID ${letterId} does not exist`);
    }
    throw error;
  }
}
