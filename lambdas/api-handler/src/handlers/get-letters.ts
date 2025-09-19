import { APIGatewayProxyEventQueryStringParameters, APIGatewayProxyHandler } from "aws-lambda";
import { getLettersForSupplier } from "../services/letter-operations";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { LetterBase } from "../../../../internal/datastore/src";
import { assertNotEmpty } from "../utils/validation";
import * as errors from '../contracts/errors';
import { lambdaConfig } from "../config/lambda-config";
import pino from 'pino';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { mapLetterBaseToApiResource } from "../mappers/letter-mapper";

const letterRepo = createLetterRepository();

const log = pino();

export const getEnvars = (): { maxLimit: number } => ({
  maxLimit: parseInt(process.env.MAX_LIMIT!)
});

// The endpoint should only return pending letters for now
const status = "PENDING";

export const getLetters: APIGatewayProxyHandler = async (event) => {

  const { maxLimit } = getEnvars();

  try {
    assertNotEmpty(event.headers, errors.ApiErrorDetail.InvalidRequestMissingSupplierId);
    const supplierId = assertNotEmpty(event.headers[lambdaConfig.SUPPLIER_ID_HEADER], errors.ApiErrorDetail.InvalidRequestMissingSupplierId);
    const limitNumber = getLimitOrDefault(event.queryStringParameters, maxLimit);

    const letters = await getLettersForSupplier(
      supplierId,
      status,
      limitNumber,
      letterRepo,
    );

    const response = {
      data: letters.map((letter: LetterBase) => (mapLetterBaseToApiResource(letter)))
    };

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
    return mapErrorToResponse(error);
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
    throw new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertLimitInRange(limitNumber: number, maxLimit: number) {
  if (limitNumber <= 0 || limitNumber > maxLimit) {
    log.info({
      description: "Limit value is invalid",
      limitNumber,
    });
    throw new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotInRange);
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
    throw new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitOnly);
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
