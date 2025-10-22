import { LetterBase, LetterRepository } from '../../../../internal/datastore/src'
import { NotFoundError, ValidationError } from '../errors';
import { LetterDto, PatchLetterResponse } from '../contracts/letters';
import { mapToPatchLetterResponse } from '../mappers/letter-mapper';
import { ApiErrorDetail } from '../contracts/errors';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Deps } from '../config/deps';


export const getLettersForSupplier = async (supplierId: string, status: string, limit: number, letterRepo: LetterRepository): Promise<LetterBase[]> => {

  return await letterRepo.getLettersBySupplier(supplierId, status, limit);
}

export const getLetterById = async (supplierId: string, letterId: string, letterRepo: LetterRepository): Promise<LetterBase> => {

  let letter;

  try {
    letter = await letterRepo.getLetterById(supplierId, letterId);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }

  return letter;
}

export const patchLetterStatus = async (letterToUpdate: LetterDto, letterId: string, letterRepo: LetterRepository): Promise<PatchLetterResponse> => {

  if (letterToUpdate.id !== letterId) {
    throw new ValidationError(ApiErrorDetail.InvalidRequestLetterIdsMismatch);
  }

  let updatedLetter;

  try {
    updatedLetter =  await letterRepo.updateLetterStatus(letterToUpdate);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }

  return mapToPatchLetterResponse(updatedLetter);
}
function isNotFoundError(error: any) {
  return error instanceof Error && /^Letter with id \w+ not found for supplier \w+$/.test(error.message);
}

export const getLetterDataUrl = async (supplierId: string, letterId: string, deps: Deps): Promise<string> => {

  let letter;

  try {
    letter = await deps.letterRepo.getLetterById(supplierId, letterId);
    return await getDownloadUrl(letter.url, deps.s3Client, deps.env.DOWNLOAD_URL_TTL_SECONDS);
  } catch (error) {
    if (error instanceof Error && /^Letter with id \w+ not found for supplier \w+$/.test(error.message)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }
}

async function getDownloadUrl(s3Uri: string, s3Client: S3Client, expiry: number) {

  const url = new URL(s3Uri); // works for s3:// URIs
  const bucket = url.hostname;
  const key = url.pathname.slice(1); // remove leading '/'

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiry });
}
