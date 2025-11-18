import { APIGatewayProxyHandler } from 'aws-lambda';
import { enqueueLetterUpdateRequests } from '../services/letter-operations';
import { PostLettersRequest, PostLettersRequestSchema } from '../contracts/letters';
import { ApiErrorDetail } from '../contracts/errors';
import { ValidationError } from '../errors';
import { processError } from '../mappers/error-mapper';
import { assertNotEmpty, requireEnvVar, validateCommonHeaders } from '../utils/validation';
import type { Deps } from "../config/deps";
import { mapPostLetterRequestToLetterDtoArray } from '../mappers/letter-mapper';

export function createPostLettersHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonHeadersResult = validateCommonHeaders(event.headers, deps);

    if (!commonHeadersResult.ok) {
      return processError(commonHeadersResult.error, commonHeadersResult.correlationId, deps.logger);
    }

    const maxUpdateItems = requireEnvVar(deps.env, "MAX_LIMIT");
    requireEnvVar(deps.env, "QUEUE_URL");

    try {
      const body = assertNotEmpty(event.body, new ValidationError(ApiErrorDetail.InvalidRequestMissingBody));

      let postLettersRequest: PostLettersRequest;

      try {
        postLettersRequest = PostLettersRequestSchema.parse(JSON.parse(body));
      } catch (error) {
        if (error instanceof Error) {
          throw new ValidationError(ApiErrorDetail.InvalidRequestBody, { cause: error});
        }
        else throw error;
      }

      if (postLettersRequest.data.length > maxUpdateItems) {
        throw new ValidationError(ApiErrorDetail.InvalidRequestLettersToUpdate, { args: [maxUpdateItems]});
      }

      if( duplicateIdsExist(postLettersRequest) ) {
        throw new ValidationError(ApiErrorDetail.InvalidRequestDuplicateLetterId);
      }

      await enqueueLetterUpdateRequests(
        mapPostLetterRequestToLetterDtoArray(postLettersRequest, commonHeadersResult.value.supplierId),
        commonHeadersResult.value.correlationId,
        deps
      );

      return {
        statusCode: 202,
        body: ''
      };

    } catch (error) {
      return processError(error, commonHeadersResult.value.correlationId, deps.logger);
    }
  };
};

function duplicateIdsExist(postLettersRequest: PostLettersRequest) {
  const ids = postLettersRequest.data.map(item => item.id);
  return new Set(ids).size !== ids.length;
}
