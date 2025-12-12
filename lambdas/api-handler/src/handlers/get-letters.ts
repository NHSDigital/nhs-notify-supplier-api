import {
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyHandler,
} from "aws-lambda";
import { Logger } from "pino";
import { getLettersForSupplier } from "../services/letter-operations";
import { extractCommonIds } from "../utils/common-ids";
import { requireEnvVar } from "../utils/validation";
import { ApiErrorDetail } from "../contracts/errors";
import { processError } from "../mappers/error-mapper";
import ValidationError from "../errors/validation-error";
import { mapToGetLettersResponse } from "../mappers/letter-mapper";
import type { Deps } from "../config/deps";

// The endpoint should only return pending letters for now
const status = "PENDING";

function validateLimitParamOnly(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
  logger: Logger,
) {
  if (
    queryStringParameters &&
    Object.keys(queryStringParameters).some((key) => key !== "limit")
  ) {
    logger.info({
      description: "Unexpected query parameter(s) present",
      queryStringParameters,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitOnly);
  }
}

function assertIsNumber(limitNumber: number, logger: Logger) {
  if (Number.isNaN(limitNumber)) {
    logger.info({
      description: "limit parameter is not a number",
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertLimitInRange(
  limitNumber: number,
  maxLimit: number,
  logger: Logger,
) {
  if (limitNumber <= 0 || limitNumber > maxLimit) {
    logger.info({
      description: "Limit value is invalid",
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotInRange, {
      args: [maxLimit],
    });
  }
}

function getLimit(limit: string | undefined, maxLimit: number, logger: Logger) {
  let result;
  if (limit) {
    const limitParam = limit;
    result = Number(limitParam);
    assertIsNumber(result, logger);
    assertLimitInRange(result, maxLimit, logger);
  } else {
    result = maxLimit;
  }
  return result;
}

function getLimitOrDefault(
  queryStringParameters: APIGatewayProxyEventQueryStringParameters | null,
  maxLimit: number,
  logger: Logger,
): number {
  validateLimitParamOnly(queryStringParameters, logger);
  return getLimit(queryStringParameters?.limit, maxLimit, logger);
}

export default function createGetLettersHandler(
  deps: Deps,
): APIGatewayProxyHandler {
  return async (event) => {
    const commonIds = extractCommonIds(
      event.headers,
      event.requestContext,
      deps,
    );

    if (!commonIds.ok) {
      return processError(
        commonIds.error,
        commonIds.correlationId,
        deps.logger,
      );
    }

    try {
      const maxLimit = requireEnvVar(deps.env, "MAX_LIMIT");

      const limitNumber = getLimitOrDefault(
        event.queryStringParameters,
        maxLimit,
        deps.logger,
      );

      const letters = await getLettersForSupplier(
        commonIds.value.supplierId,
        status,
        limitNumber,
        deps.letterRepo,
      );

      const response = mapToGetLettersResponse(letters);

      deps.logger.info({
        description: "Pending letters successfully fetched",
        supplierId: commonIds.value.supplierId,
        limitNumber,
        status,
        lettersCount: letters.length,
      });

      return {
        statusCode: 200,
        body: JSON.stringify(response, null, 2),
      };
    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}
