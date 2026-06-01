import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIRequestContext } from "@playwright/test";
import z from "zod";
import {
  AWS_ACCOUNT_ID,
  GET_LETTERS_MAX_RETRIES,
  LETTERQUEUE_TABLENAME,
  LETTERSTABLENAME,
  MI_ENDPOINT,
  SUPPLIERTABLENAME,
  SUPPLIER_LETTERS,
  VISIBILITY_TIMEOUT_SECONDS,
  envName,
} from "../constants/api-constants";
import { createSupplierData, runCreateLetter } from "./pnpm-helpers";
import { logger } from "./pino-logger";
import {
  GetLettersResponse,
  GetLettersResponseSchema,
} from "../../lambdas/api-handler/src/contracts/letters";
import { GetMIResponse, GetMIResponseSchema } from "../../lambdas/api-handler/src/contracts/mi";
import { ErrorResponse } from "../../lambdas/api-handler/src/contracts/errors";

const ddb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddb);

export const PendingLetterSchema = z.object({
  supplierId: z.string(),
  letterId: z.string(),
  queueTimestamp: z.string(),
  visibilityTimestamp: z.string(),
  queueSortOrderSk: z.string().describe("Secondary index SK"),
  priority: z.int().min(0).max(99).optional(),
});
export type PendingLetter = z.infer<typeof PendingLetterSchema>;

export interface SupplierApiLetters {
  supplierId: string;
  specificationId: string;
  supplierStatus: string;
  createdAt: string;
  supplierStatusSk: string;
  updatedAt: string;
  groupId: string;
  reasonCode: string;
  id: string;
  url: string;
  ttl: string;
  reasonText: string;
  status: string;
  source: string;
}

export async function createTestData(
  supplierId: string,
  count?: number,
): Promise<void> {
  await runCreateLetter({
    filter: "nhs-notify-supplier-api-letter-test-data-utility",
    supplierId,
    environment: envName,
    awsAccountId: AWS_ACCOUNT_ID,
    groupId: "TestGroupID",
    specificationId: "TestSpecificationID",
    status: "PENDING",
    count: count || 1,
    testLetter: "test-letter-standard",
  });
}

export const getLettersBySupplier = async (
  supplierId: string,
  status: string,
  limit: number,
) => {
  const supplierStatus = `${supplierId}#${status}`;
  const params = {
    TableName: LETTERSTABLENAME,
    IndexName: "supplierStatus-index",
    KeyConditionExpression: "supplierStatus = :supplierStatus",
    ProjectionExpression:
      "id, specificationId, groupId, reasonCode, reasonText",
    ExpressionAttributeValues: {
      ":supplierStatus": supplierStatus,
    },
    Limit: limit,
  };

  const { Items } = await docClient.send(new QueryCommand(params));
  if (!Items || Items.length === 0) {
    throw new Error(`Unexpectedly found no data found for ${supplierId}.`);
  }
  return Items as SupplierApiLetters[];
};

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type FetchLettersWithRetryOptions = {
  lettersLimit?: string;
  waitForVisibilityTimeout?: boolean;
};

type GetLettersResponseBody =
  | GetLettersResponse
  | ErrorResponse
  | Record<string, unknown>;

type FetchLettersWithRetryResult = {
  statusCode: number;
  responseBody: GetLettersResponseBody;
};

type GetMIResponseBody =
  | GetMIResponse
  | ErrorResponse
  | Record<string, unknown>;

type FetchMiResult = {
  statusCode: number;
  responseBody: GetMIResponseBody;
};

export function isGetLettersResponse(
  responseBody: GetLettersResponseBody,
): responseBody is GetLettersResponse {
  return GetLettersResponseSchema.safeParse(responseBody).success;
}

export function isGetMIResponse(
  responseBody: GetMIResponseBody,
): responseBody is GetMIResponse {
  return GetMIResponseSchema.safeParse(responseBody).success;
}

export function isErrorResponse(
  responseBody: GetLettersResponseBody,
): responseBody is ErrorResponse {
  return (
    typeof responseBody === "object" &&
    Array.isArray((responseBody as ErrorResponse).errors)
  );
}

function parseGetLettersResponseBody(
  parsedBody: unknown,
): GetLettersResponseBody {
  const parsedGetLettersResponse =
    GetLettersResponseSchema.safeParse(parsedBody);
  if (parsedGetLettersResponse.success) {
    return parsedGetLettersResponse.data;
  }

  if (isErrorResponse(parsedBody as GetLettersResponseBody)) {
    return parsedBody as ErrorResponse;
  }

  return parsedBody as Record<string, unknown>;
}

function parseGetMIResponseBody(
  parsedBody: unknown,
): GetMIResponseBody {
  const parsedGetMIResponse =
    GetMIResponseSchema.safeParse(parsedBody);
  if (parsedGetMIResponse.success) {
    return parsedGetMIResponse.data;
  }

  if (isErrorResponse(parsedBody as GetMIResponseBody)) {
    return parsedBody as ErrorResponse;
  }

  return parsedBody as Record<string, unknown>;
}

function shouldRetryGetLettersRequest(
  waitForVisibilityTimeout: boolean,
  statusCode: number,
  responseBody: GetLettersResponseBody,
): boolean {
  const dataIsEmpty =
    isGetLettersResponse(responseBody) &&
    Array.isArray(responseBody.data) &&
    responseBody.data.length === 0;

  return waitForVisibilityTimeout && statusCode === 200 && dataIsEmpty;
}

export async function getLettersWithRetry(
  request: APIRequestContext,
  baseUrl: string,
  headers: Record<string, string>,
  options?: FetchLettersWithRetryOptions,
): Promise<FetchLettersWithRetryResult> {
  const limit = options?.lettersLimit;
  const waitForVisibilityTimeout = options?.waitForVisibilityTimeout ?? true;

  const executeGetLettersRequest =
    limit === undefined
      ? () =>
          request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
            headers,
          })
      : () =>
          request.get(`${baseUrl}/${SUPPLIER_LETTERS}`, {
            headers,
            params: {
              limit,
            },
          });

  for (let attempt = 0; attempt <= GET_LETTERS_MAX_RETRIES; attempt++) {
    const response = await executeGetLettersRequest();
    const statusCode = response.status();

    const parsedBody = (await response.json()) as unknown;
    const responseBody = parseGetLettersResponseBody(parsedBody);

    const shouldRetry = shouldRetryGetLettersRequest(
      waitForVisibilityTimeout,
      statusCode,
      responseBody,
    );

    if (!shouldRetry || attempt === GET_LETTERS_MAX_RETRIES) {
      return { statusCode, responseBody };
    }

    await delay(VISIBILITY_TIMEOUT_SECONDS * 1000);
  }

  throw new Error("Unexpectedly exhausted GET /letters retries");
}

export async function getMI(
  miId:    string,
  request: APIRequestContext,
  baseUrl: string,
  headers: Record<string, string>,
): Promise<FetchMiResult> { // change retrun type to FetchMiResult and create new type if the response body shape is different to the get letters response, currently reusing as the response shapes are the same and to avoid code duplication

  const executeGetMiRequest =
    () =>
          request.get(`${baseUrl}/${MI_ENDPOINT}`, {
            headers,
            params: {
              miId,
            },
          });

  const response = await executeGetMiRequest();
  const statusCode = response.status();

  const parsedBody = (await response.json()) as unknown;
  const responseBody = parseGetMIResponseBody(parsedBody);
  return { statusCode, responseBody };
}


export async function waitForLetterStatus(
  supplierId: string,
  id: string,
  status: string,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
  },
): Promise<SupplierApiLetters> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const intervalMs = options?.intervalMs ?? 5000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { Item } = await docClient.send(
      new GetCommand({
        TableName: LETTERSTABLENAME,
        Key: { id, supplierId },
        ProjectionExpression: "id, #status, supplierId",
        ExpressionAttributeNames: {
          "#status": "status",
        },
      }),
    );

    const letter = Item as SupplierApiLetters;

    if (letter && letter.status === status) {
      return letter;
    }

    await delay(intervalMs);
  }

  throw new Error(
    `Timed out waiting for letter ${id} to reach status ${status} for supplier ${supplierId}.`,
  );
}

export const deleteLettersBySupplier = async (
  supplierId: string,
  id: string,
) => {
  const resp = await docClient.send(
    new DeleteCommand({
      TableName: LETTERSTABLENAME,
      Key: { id, supplierId },
      ReturnValues: "ALL_OLD",
    }),
  );
  return resp.Attributes;
};

export async function checkSupplierExists(
  supplierId: string,
): Promise<boolean> {
  try {
    const params = {
      TableName: SUPPLIERTABLENAME,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": supplierId,
      },
    };

    const { Items } = await docClient.send(new QueryCommand(params));
    return Items !== undefined && Items.length > 0;
  } catch (error) {
    logger.error({ supplierId, error }, "Supplier existence check failed");
    return false;
  }
}

export async function createSupplierEntry(supplierId: string): Promise<void> {
  await createSupplierData({
    filter: "nhs-notify-supplier-api-suppliers-data-utility",
    supplierId,
    apimId: supplierId,
    name: "TestSupplier",
    environment: envName,
    status: "ENABLED",
  });
}

export async function checkLetterQueueTable(
  supplierId: string,
  letterId: string,
  checkForDeletedLetters?: boolean,
): Promise<[boolean, number?]> {
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 10_000;
  try {
    const params = {
      TableName: LETTERQUEUE_TABLENAME,
      KeyConditionExpression:
        "supplierId = :supplierId AND letterId = :letterId",
      ExpressionAttributeValues: {
        ":supplierId": supplierId,
        ":letterId": letterId,
      },
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { Items } = await docClient.send(new QueryCommand(params));
      if (!checkForDeletedLetters && Items !== undefined && Items.length > 0) {
        logger.info(
          `Queried letter queue table to verify existence for letterId ${letterId} and found items, confirming existence`,
        );
        return [true, Items.length];
      }
      if (checkForDeletedLetters && Items !== undefined && Items.length === 0) {
        logger.info(
          `Queried letter queue table to verify deletion for letterId ${letterId} and found no items, confirming deletion`,
        );
        return [true];
      }
      if (attempt < MAX_ATTEMPTS) {
        logger.info(
          `Retrying letter queue query for supplierId ${supplierId} and letterId ${letterId} in ${RETRY_DELAY_MS}ms`,
        );
        await delay(RETRY_DELAY_MS);
      }
    }

    return [false];
  } catch (error) {
    logger.error({ supplierId, letterId, error }, "Letter queue query failed");
    return [false];
  }
}

export async function getLettersFromQueueViaIndex(
  supplierId: string,
): Promise<PendingLetter[]> {
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 10_000;

  try {
    const params = {
      TableName: LETTERQUEUE_TABLENAME,
      IndexName: "queueSortOrder-index",
      KeyConditionExpression: "supplierId = :supplierId",
      ExpressionAttributeValues: {
        ":supplierId": supplierId,
      },
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { Items } = await docClient.send(new QueryCommand(params));

      if (Items !== undefined && Items.length > 0) {
        logger.info(
          `Queried letter queue table to verify existence for supplier ${supplierId} and found items.`,
        );

        // assumes no pagination needed as we expect a small number of letters in the queue for the test supplier
        return z.array(PendingLetterSchema).parse(Items);
      }
      if (attempt < MAX_ATTEMPTS) {
        logger.info(
          `Retrying get letters from queue for supplierId ${supplierId} in ${RETRY_DELAY_MS}ms`,
        );
        await delay(RETRY_DELAY_MS);
      }
    }
    return [];
  } catch (error) {
    logger.error({ supplierId, error }, "Letter queue query failed");
    return [];
  }
}

export async function getLetterFromQueueById(
  supplierId: string,
  letterId: string,
): Promise<PendingLetter[]> {
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY_MS = 10_000;

  try {
    const params = {
      TableName: LETTERQUEUE_TABLENAME,
      KeyConditionExpression:
        "supplierId = :supplierId AND letterId = :letterId",
      ExpressionAttributeValues: {
        ":supplierId": supplierId,
        ":letterId": letterId,
      },
    };

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { Items } = await docClient.send(new QueryCommand(params));

      if (Items !== undefined && Items.length > 0) {
        logger.info(
          `Queried letter queue table to verify existence for supplier ${supplierId} and found items.`,
        );

        // assumes no pagination needed as we expect a small number of letters in the queue for the test supplier
        return z.array(PendingLetterSchema).parse(Items);
      }
      if (attempt < MAX_ATTEMPTS) {
        logger.info(
          `Retrying get letters from queue for supplierId ${supplierId} in ${RETRY_DELAY_MS}ms`,
        );
        await delay(RETRY_DELAY_MS);
      }
    }
    return [];
  } catch (error) {
    logger.error({ supplierId, error }, "Letter queue query failed");
    return [];
  }
}
