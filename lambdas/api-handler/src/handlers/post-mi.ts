import { APIGatewayProxyHandler } from "aws-lambda";
import { createMIRepository } from "../infrastructure/mi-repo-factory";
import { postMI as postMIOperation } from '../services/mi-operations';
import { lambdaConfig } from "../config/lambda-config";
import { ApiErrorDetail } from "../contracts/errors";
import { ValidationError } from "../errors";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { PostMIRequest, PostMIRequestSchema } from "../contracts/mi";
import { mapToMI } from "../mappers/mi-mapper";

const miRepo = createMIRepository();
export const postMi: APIGatewayProxyHandler = async (event) => {

  let correlationId;

  try {
    assertNotEmpty(event.headers, new Error('The request headers are empty'));
    const lowerCasedHeaders = lowerCaseKeys(event.headers);
    correlationId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.APIM_CORRELATION_HEADER], new Error("The request headers don't contain the APIM correlation id"));
    const supplierId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.SUPPLIER_ID_HEADER], new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));
    const body = assertNotEmpty(event.body, new ValidationError(ApiErrorDetail.InvalidRequestMissingBody));

    let postMIRequest: PostMIRequest;

    try {
      postMIRequest = PostMIRequestSchema.parse(JSON.parse(body));
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(ApiErrorDetail.InvalidRequestBody, { cause: error});
      }
      else throw error;
    }
    validateIso8601Timestamp(postMIRequest.data.attributes.timestamp);

    const result = await postMIOperation(mapToMI(postMIRequest, supplierId), miRepo);

    return {
      statusCode: 201,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    return mapErrorToResponse(error, correlationId);
  }

  function validateIso8601Timestamp(timestamp: string) {

    const date = new Date(timestamp);
    if (Number.isNaN(date.valueOf()) || date.toISOString() !== timestamp) {
      throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
    }
  }
};
