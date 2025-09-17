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

// The endpoint should only return pending letters for now
const status = "PENDING";

export const getLetters: APIGatewayProxyHandler = async (event) => {

  try {
    const supplierId = assertNotEmpty(event.headers[lambdaConfig.SUPPLIER_ID_HEADER], errors.ApiErrorDetail.InvalidRequestMissingSupplierId);
    const limitNumber = validateLimit(event.queryStringParameters);

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

function validateLimit(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null) : number {

  let limit = queryStringParameters?.limit;

  if (!limit) {
    limit = "10";
  }

  let limitNumber = Number(limit);

  assertIsNumber(limitNumber, limit);
  assertIsPositive(limitNumber, limit);

  return limitNumber;
}

function assertIsNumber(limitNumber: number, limit: string) {
  if (isNaN(limitNumber)) {
    log.info({
      description: "limit parameter is not a number",
      limit,
    });
    throw new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotANumber);
  }
}

function assertIsPositive(limitNumber: number, limit?: string) {
  if (limitNumber < 0) {
    log.info({
      description: "limit parameter is not positive",
      limit,
    });
    throw new ValidationError(errors.ApiErrorDetail.InvalidRequestLimitNotPositive);
  }
}
