import { APIGatewayProxyHandler } from "aws-lambda";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { lambdaConfig } from "../config/lambda-config";
import pino from 'pino';
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";

const letterRepo = createLetterRepository();

const log = pino();

// The endpoint should only return pending letters for now
const status = "PENDING";

export const getLetters: APIGatewayProxyHandler = async (event) => {

  let correlationId;

  try {
    assertNotEmpty(event.headers, new Error("The request headers are empty"));
    const lowerCasedHeaders = lowerCaseKeys(event.headers);
    correlationId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.APIM_CORRELATION_HEADER], new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.SUPPLIER_ID_HEADER], new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));

    // assert if letter exists and retrieve
    // call service


    // map response

    return {
      statusCode: 200,
      body: JSON.stringify({}, null, 2),
    };
  }
  catch (error) {
    return mapErrorToResponse(error, correlationId);
  }
};
