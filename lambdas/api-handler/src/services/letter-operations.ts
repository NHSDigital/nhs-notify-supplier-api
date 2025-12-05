import { LetterBase, LetterRepository } from "@internal/datastore";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import NotFoundError from "../errors/not-found-error";
import { UpdateLetterCommand } from "../contracts/letters";
import { ApiErrorDetail } from "../contracts/errors";
import { Deps } from "../config/deps";

function isNotFoundError(error: any) {
  return (
    error instanceof Error &&
    /^Letter with id \w+ not found for supplier \w+$/.test(error.message)
  );
}

async function getDownloadUrl(
  s3Uri: string,
  s3Client: S3Client,
  expiry: number,
) {
  const url = new URL(s3Uri); // works for s3:// URIs
  const bucket = url.hostname;
  const key = url.pathname.slice(1); // remove leading '/'

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiry });
}

export const getLettersForSupplier = async (
  supplierId: string,
  status: string,
  limit: number,
  letterRepo: LetterRepository,
): Promise<LetterBase[]> => {
  return letterRepo.getLettersBySupplier(supplierId, status, limit);
};

export const getLetterById = async (
  supplierId: string,
  letterId: string,
  letterRepo: LetterRepository,
): Promise<LetterBase> => {
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
};

export const getLetterDataUrl = async (
  supplierId: string,
  letterId: string,
  deps: Deps,
): Promise<string> => {
  let letter;

  try {
    letter = await deps.letterRepo.getLetterById(supplierId, letterId);
    return await getDownloadUrl(
      letter.url,
      deps.s3Client,
      deps.env.DOWNLOAD_URL_TTL_SECONDS,
    );
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new NotFoundError(ApiErrorDetail.NotFoundLetterId);
    }
    throw error;
  }
};

export async function enqueueLetterUpdateRequests(
  updateLetterCommands: UpdateLetterCommand[],
  correlationId: string,
  deps: Deps,
) {
  const tasks = updateLetterCommands.map(
    async (request: UpdateLetterCommand) => {
      try {
        const command = new SendMessageCommand({
          QueueUrl: deps.env.QUEUE_URL,
          MessageAttributes: {
            CorrelationId: { DataType: "String", StringValue: correlationId },
          },
          MessageBody: JSON.stringify(request),
        });
        await deps.sqsClient.send(command);
      } catch (error) {
        deps.logger.error(
          {
            err: error,
            correlationId,
            letterId: request.id,
            letterStatus: request.status,
            supplierId: request.supplierId,
          },
          "Error enqueuing letter status update",
        );
      }
    },
  );

  await Promise.all(tasks);
}
