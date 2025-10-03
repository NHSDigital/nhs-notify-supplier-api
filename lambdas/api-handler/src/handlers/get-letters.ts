import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyHandler } from "aws-lambda";
import { getLettersForSupplier } from "../services/letter-operations";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { assertNotEmpty } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { lambdaConfig } from "../config/lambda-config";
import pino from 'pino';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { mapToGetLettersResponse } from "../mappers/letter-mapper";

const letterRepo = createLetterRepository();

const log = pino();

export const getEnvars = (): { maxLimit: number } => ({
  maxLimit: parseInt(process.env.MAX_LIMIT!)
});

// The endpoint should only return pending letters for now
const status = "PENDING";

export const getLetters: APIGatewayProxyHandler = async (event) => {

  const { maxLimit } = getEnvars();
  let correlationId;

  try {
    assertNotEmpty(event.headers, new Error("The request headers are empty"));
    correlationId = assertNotEmpty(event.headers[lambdaConfig.APIM_CORRELATION_HEADER], new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(event.headers[lambdaConfig.SUPPLIER_ID_HEADER], new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
    const limitNumber = getLimitOrDefault(event.queryStringParameters, maxLimit);

    const letters = await getLettersForSupplier(
      supplierId,
      status,
      limitNumber,
      letterRepo,
    );

    const response = mapToGetLettersResponse(letters);

    log.info({
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
    return mapErrorToResponse(error, correlationId);
  }
};

function getLimitOrDefault(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null, maxLimit: number) : number {

  validateLimitParamOnly(queryStringParameters);
  return getLimit(queryStringParameters?.limit, maxLimit);
}

function assertIsNumber(limitNumber: number) {
  if (isNaN(limitNumber)) {
    log.info({
      description: "limit parameter is not a number",
      limitNumber,
    });
    throw new ValidationError(ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertLimitInRange(limitNumber: number, maxLimit: number) {
  if (limitNumber <= 0 || limitNumber > maxLimit) {
    log.info({
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
    log.info({
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
