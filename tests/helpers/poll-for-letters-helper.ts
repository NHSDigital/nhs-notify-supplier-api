import type { APIRequestContext } from "@playwright/test";
import { createValidRequestHeaders } from "tests/constants/request-headers";
import { SUPPLIER_LETTERS } from "tests/constants/api-constants";
import { logger } from "./pino-logger";

async function pollForLetterStatus(
  request: APIRequestContext,
  supplierId: string,
  domainId: string,
  baseUrl: string,
): Promise<{ letterStatus: string | undefined; statusCode: number }> {
  const headers = createValidRequestHeaders(supplierId);
  let statusCode = 0;
  let letterStatus: string | undefined;
  const RETRY_DELAY_MS = 10_000;
  const MAX_ATTEMPTS = 5;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const getLetterResponse = await request.get(
      `${baseUrl}/${SUPPLIER_LETTERS}/${domainId}`,
      {
        headers,
      },
    );

    statusCode = getLetterResponse.status();
    const responseBody = (await getLetterResponse.json()) as {
      data?: { attributes?: { status?: string } };
    };
    letterStatus = responseBody.data?.attributes?.status;

    if (statusCode === 200 && letterStatus === "PENDING") {
      logger.info(
        `Attempt ${attempt}: Received status code ${statusCode} for domainId: ${domainId}`,
      );
      break;
    }

    if (attempt < MAX_ATTEMPTS) {
      logger.info(
        `Attempt ${attempt}: Received status code ${statusCode} for domainId: ${domainId}. Retrying after ${RETRY_DELAY_MS / 1000} seconds...`,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, RETRY_DELAY_MS);
      });
    }
  }

  return { letterStatus, statusCode };
}

export async function pollForLettersInDb(
  request: APIRequestContext,
  supplierId: string,
  domainId: string,
  baseUrl: string,
): Promise<{ letterStatus: string | undefined; statusCode: number }> {
  return pollForLetterStatus(request, supplierId, domainId, baseUrl);
}

export async function getLetterStatusFromApi(
  request: APIRequestContext,
  supplierId: string,
  domainId: string,
  baseUrl: string,
): Promise<{ letterStatus: string | undefined; statusCode: number }> {
  return pollForLetterStatus(request, supplierId, domainId, baseUrl);
}
