import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyHandler } from 'aws-lambda';
import { getLettersForSupplier } from '../services/letter-operations';
import { extractCommonIds } from '../utils/commonIds';
import { requireEnvVar } from '../utils/validation';
import { ApiErrorDetail } from '../contracts/errors';
import { processError } from '../mappers/error-mapper';
import { ValidationError } from '../errors';
import { mapToGetLettersResponse } from '../mappers/letter-mapper';
import type { Deps } from '../config/deps';
import { Logger } from 'pino';

// The endpoint should only return pending letters for now
const status = 'PENDING';

export function createGetLettersHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonIds = extractCommonIds(event.headers, event.requestContext, deps);

    if (!commonIds.ok) {
      return processError(commonIds.error, commonIds.correlationId, deps.logger);
    }

    try {
      const maxLimit = requireEnvVar(deps.env, "MAX_LIMIT");

      const limitNumber = getLimitOrDefault(event.queryStringParameters, maxLimit, deps.logger);

      const letters = await getLettersForSupplier(
        commonIds.value.supplierId,
        status,
        limitNumber,
        deps.letterRepo,
      );

      const response = mapToGetLettersResponse(letters);

      deps.logger.info({
        description: 'Pending letters successfully fetched',
        supplierId: commonIds.value.supplierId,
        limitNumber,
        status,
        lettersCount: letters.length
      });

      return {
        statusCode: 200,
        body: JSON.stringify(response, null, 2),
      };
    }
    catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  }
};

function getLimitOrDefault(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null, maxLimit: number, logger: Logger) : number {

  validateLimitParamOnly(queryStringParameters, logger);
  return getLimit(queryStringParameters?.limit, maxLimit, logger);
}

function validateLimitParamOnly(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null, logger: Logger) {
  if (
    queryStringParameters &&
    Object.keys(queryStringParameters).some(
      (key) => key !== 'limit'
    )
  ) {
    logger.info({
      description: 'Unexpected query parameter(s) present',
      queryStringParameters: queryStringParameters,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitOnly);
  }
}

function getLimit(limit: string | undefined, maxLimit: number, logger: Logger) {
  let result;
  if (limit) {
    let limitParam = limit;
    result = Number(limitParam);
    assertIsNumber(result, logger);
    assertLimitInRange(result, maxLimit, logger);
  } else {
    result = maxLimit;
  }
  return result;
}

function assertIsNumber(limitNumber: number, logger: Logger) {
  if (isNaN(limitNumber)) {
    logger.info({
      description: 'limit parameter is not a number',
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertLimitInRange(limitNumber: number, maxLimit: number, logger: Logger) {
  if (limitNumber <= 0 || limitNumber > maxLimit) {
    logger.info({
      description: 'Limit value is invalid',
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [maxLimit]});
  }
}
