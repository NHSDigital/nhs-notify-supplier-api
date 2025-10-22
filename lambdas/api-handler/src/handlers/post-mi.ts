import { APIGatewayProxyHandler } from "aws-lambda";
import { postMI as postMIOperation } from '../services/mi-operations';
import { ApiErrorDetail } from "../contracts/errors";
import { ValidationError } from "../errors";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { assertNotEmpty, validateCommonHeaders } from "../utils/validation";
import { PostMIRequest, PostMIRequestSchema } from "../contracts/mi";
import { mapToMI } from "../mappers/mi-mapper";
import { Deps } from "../config/deps";

export function createPostMIHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return mapErrorToResponse(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    try {
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

      const result = await postMIOperation(mapToMI(postMIRequest, commonHeadersResult.value.supplierId), deps.miRepo);

      return {
        statusCode: 201,
        body: JSON.stringify(result, null, 2)
      };

    } catch (error) {
      return mapErrorToResponse(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  }

  function validateIso8601Timestamp(timestamp: string) {

    // If timestamp looks like a date, but is not valid (e.g. 2025-02-31T13:45:56Z), then new Date(timestamp).valueOf()
    // will return NaN
    if (! /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z/.test(timestamp) || Number.isNaN(new Date(timestamp).valueOf())) {
      throw new ValidationError(ApiErrorDetail.InvalidRequestTimestamp);
    }
  }
};
