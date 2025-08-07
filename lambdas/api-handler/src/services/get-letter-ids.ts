import { LetterRepository } from '../../../../internal/datastore'

export const getLetterIdsForSupplier = async (supplierId: string, letterRepo: LetterRepository): Promise<string[]> => {

  return await letterRepo.getLetterIdsBySupplier(supplierId);
}
