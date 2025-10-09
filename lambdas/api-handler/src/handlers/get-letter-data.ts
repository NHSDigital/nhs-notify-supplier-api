import { APIGatewayProxyHandler } from "aws-lambda";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { ApiErrorDetail } from '../contracts/errors';
import { lambdaConfig } from "../config/lambda-config";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { ValidationError } from "../errors";
import { getLetterDataUrl } from "../services/letter-operations";

const letterRepo = createLetterRepository();

export const getLetterData: APIGatewayProxyHandler = async (event) => {

  let correlationId;

  try {
    assertNotEmpty(event.headers, new Error("The request headers are empty"));
    const lowerCasedHeaders = lowerCaseKeys(event.headers);
    correlationId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.APIM_CORRELATION_HEADER], new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.SUPPLIER_ID_HEADER], new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
    const letterId = assertNotEmpty( event.pathParameters?.id, new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

    return {
      statusCode: 303,
      Location: await getLetterDataUrl(supplierId, letterId, letterRepo),
      body: ''
    };
  }
  catch (error) {
    return mapErrorToResponse(error, correlationId);
  }
};
