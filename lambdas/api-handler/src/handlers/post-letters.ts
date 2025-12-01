import { APIGatewayProxyHandler } from 'aws-lambda';
import { mapToUpdateCommands } from "../mappers/letter-mapper";
import type { Deps } from "../config/deps";
import { ApiErrorDetail } from '../contracts/errors';
import { PostLettersRequest, PostLettersRequestSchema } from '../contracts/letters';
import { ValidationError } from '../errors';
import { processError } from '../mappers/error-mapper';
import { enqueueLetterUpdateRequests } from '../services/letter-operations';
import { extractCommonIds } from '../utils/commonIds';
import { assertNotEmpty, requireEnvVar } from '../utils/validation';

export function createPostLettersHandler(deps: Deps): APIGatewayProxyHandler {

  return async (event) => {

    const commonIds = extractCommonIds(event.headers, event.requestContext, deps);

    if (!commonIds.ok) {
      return processError(commonIds.error, commonIds.correlationId, deps.logger);
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
        mapToUpdateCommands(postLettersRequest, commonIds.value.supplierId),
        commonIds.value.correlationId,
        deps
      );

      return {
        statusCode: 202,
        body: ''
      };

    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
};

function duplicateIdsExist(postLettersRequest: PostLettersRequest) {
  const ids = postLettersRequest.data.map(item => item.id);
  return new Set(ids).size !== ids.length;
}
