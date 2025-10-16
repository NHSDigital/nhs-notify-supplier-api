import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyHandler } from "aws-lambda";
import { getLettersForSupplier } from "../services/letter-operations";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { mapToGetLettersResponse } from "../mappers/letter-mapper";
import { Deps, getDeps } from "../config/deps";

const deps: Deps = getDeps();

export const getMaxLimit = (): { maxLimit: number } => ({
  maxLimit: parseInt(process.env.MAX_LIMIT!)
});

// The endpoint should only return pending letters for now
const status = "PENDING";

export const getLetters: APIGatewayProxyHandler = async (event) => {

  const { maxLimit } = getMaxLimit();

  let correlationId: string | undefined;

  try {
    assertNotEmpty(event.headers, new Error("The request headers are empty"));
    const lowerCasedHeaders = lowerCaseKeys(event.headers);
    correlationId = assertNotEmpty(lowerCasedHeaders[deps.env.APIM_CORRELATION_HEADER],
      new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(lowerCasedHeaders[deps.env.SUPPLIER_ID_HEADER],
      new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
    const limitNumber = getLimitOrDefault(event.queryStringParameters, maxLimit);

    const letters = await getLettersForSupplier(
      supplierId,
      status,
      limitNumber,
      deps.letterRepo,
    );

    const response = mapToGetLettersResponse(letters);

    deps.logger.info({
      description: 'Pending letters successfully fetched',
      supplierId,
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
    return mapErrorToResponse(error, correlationId, deps.logger);
  }
};

function getLimitOrDefault(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null, maxLimit: number) : number {

  validateLimitParamOnly(queryStringParameters);
  return getLimit(queryStringParameters?.limit, maxLimit);
}

function assertIsNumber(limitNumber: number) {
  if (isNaN(limitNumber)) {
    deps.logger.info({
      description: "limit parameter is not a number",
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertLimitInRange(limitNumber: number, maxLimit: number) {
  if (limitNumber <= 0 || limitNumber > maxLimit) {
    deps.logger.info({
      description: "Limit value is invalid",
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotInRange, { args: [maxLimit]});
  }
}

function validateLimitParamOnly(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null) {
  if (
    queryStringParameters &&
    Object.keys(queryStringParameters).some(
      (key) => key !== "limit"
    )
  ) {
    deps.logger.info({
      description: "Unexpected query parameter(s) present",
      queryStringParameters: queryStringParameters,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitOnly);
  }
}

function getLimit(limit: string | undefined, maxLimit: number) {
  let result;
  if (limit) {
    let limitParam = limit;
    result = Number(limitParam);
    assertIsNumber(result);
    assertLimitInRange(result, maxLimit);
  } else {
    result = maxLimit;
  }
  return result;
}
