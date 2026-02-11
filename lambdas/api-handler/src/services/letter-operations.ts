import { LetterBase, LetterRepository } from "@internal/datastore";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
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

function chunk(
  arr: UpdateLetterCommand[],
  size: number,
): UpdateLetterCommand[][] {
  const chunks: UpdateLetterCommand[][] = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function enqueueLetterUpdateRequests(
  updateLetterCommands: UpdateLetterCommand[],
  correlationId: string,
  deps: Deps,
) {
  const BATCH_SIZE = 10; // SQS SendMessageBatch max
  const CONCURRENCY = 5; // number of parallel batch API calls

  const batches = chunk(updateLetterCommands, BATCH_SIZE);

  // send batches in groups with limited concurrency
  // BATCH_SIZE * CONCURRENCY is the number of total updates / db calls in-flight
  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const window = batches.slice(i, i + CONCURRENCY);

    await Promise.all(
      window.map(async (batch, batchIdx) => {
        const entries = batch.map((request, idx) => ({
          Id: `${i + batchIdx}-${idx}`, // unique per batch entry
          MessageBody: JSON.stringify(request),
          MessageAttributes: {
            CorrelationId: { DataType: "String", StringValue: correlationId },
          },
        }));

        const cmd = new SendMessageBatchCommand({
          QueueUrl: deps.env.QUEUE_URL,
          Entries: entries,
        });

        try {
          const result = await deps.sqsClient.send(cmd);
          if (result.Successful && result.Successful.length > 0) {
            deps.logger.info({
              description: "Enqueued letter updates",
              correlationId,
              messageIds: result.Successful.map((entry) => entry.MessageId),
            });
          }
          if (result.Failed && result.Failed.length > 0) {
            deps.logger.error({
              failed: result.Failed,
              description: "Some batch entries failed",
              correlationId,
            });
          }
        } catch (error) {
          deps.logger.error({
            err: error,
            description: "Error enqueuing letter status updates",
            correlationId,
          });
        }
      }),
    );
  }
}
