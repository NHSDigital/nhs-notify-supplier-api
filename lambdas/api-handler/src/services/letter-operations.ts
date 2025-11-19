import { LetterBase, LetterRepository } from '@internal/datastore';
import { NotFoundError } from '../errors';
import { LetterDto } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from "@aws-sdk/client-sqs";
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

export const getLetterDataUrl = async (supplierId: string, letterId: string, deps: Deps): Promise<string> => {

  let letter;

  try {
    letter = await deps.letterRepo.getLetterById(supplierId, letterId);
    return await getDownloadUrl(letter.url, deps.s3Client, deps.env.DOWNLOAD_URL_TTL_SECONDS);
  } catch (error) {
    if (isNotFoundError(error)) {
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

export async function enqueueLetterUpdateRequests(updateRequests: LetterDto[], correlationId: string, deps: Deps) {

  const tasks = updateRequests.map(async (request: LetterDto) => {
    try {
      const command = new SendMessageCommand({
        QueueUrl: deps.env.QUEUE_URL,
        MessageAttributes: {
          CorrelationId: { DataType: 'String', StringValue: correlationId },
        },
        MessageBody: JSON.stringify(request),
      });
      await deps.sqsClient.send(command);
    } catch (err) {
      deps.logger.error({
        err,
        correlationId: correlationId,
        letterId: request.id,
        letterStatus: request.status,
        supplierId: request.supplierId
      }, 'Error enqueuing letter status update');
    }
  });

  await Promise.all(tasks);
}

function isNotFoundError(error: any) {
  return error instanceof Error && /^Letter with id \w+ not found for supplier \w+$/.test(error.message);
}
