import { APIGatewayProxyHandler } from "aws-lambda";
import type { Deps } from "../config/deps";
import { ApiErrorDetail } from "../contracts/errors";
import {
  PostLettersRequest,
  PostLettersRequestSchema,
} from "../contracts/letters";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { mapToUpdateCommands } from "../mappers/letter-mapper";
import { enqueueLetterUpdateRequests } from "../services/letter-operations";
import { extractCommonIds } from "../utils/common-ids";
import { assertNotEmpty, requireEnvVar } from "../utils/validation";

function duplicateIdsExist(postLettersRequest: PostLettersRequest) {
  const ids = postLettersRequest.data.map((item) => item.id);
  return new Set(ids).size !== ids.length;
}

export default function createPostLettersHandler(
  deps: Deps,
): APIGatewayProxyHandler {
  return async (event) => {
    const commonIds = extractCommonIds(
      event.headers,
      event.requestContext,
      deps,
    );

    if (!commonIds.ok) {
      return processError(
        commonIds.error,
        commonIds.correlationId,
        deps.logger,
      );
    }

    const maxUpdateItems = requireEnvVar(deps.env, "MAX_LIMIT");
    requireEnvVar(deps.env, "QUEUE_URL");

    try {
      const body = assertNotEmpty(
        event.body,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
      );

      let postLettersRequest: PostLettersRequest;

      try {
        postLettersRequest = PostLettersRequestSchema.parse(JSON.parse(body));
      } catch (error) {
        const typedError =
          error instanceof Error
            ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                cause: error,
              })
            : error;
        throw typedError;
      }

      deps.logger.info({
        description: "Received post letters request",
        supplierId: commonIds.value.supplierId,
        letterIds: postLettersRequest.data.map((letter) => letter.id),
        correlationId: commonIds.value.correlationId,
      });

      if (postLettersRequest.data.length > maxUpdateItems) {
        throw new ValidationError(
          ApiErrorDetail.InvalidRequestLettersToUpdate,
          { args: [maxUpdateItems] },
        );
      }

      if (duplicateIdsExist(postLettersRequest)) {
        throw new ValidationError(
          ApiErrorDetail.InvalidRequestDuplicateLetterId,
        );
      }

      await enqueueLetterUpdateRequests(
        mapToUpdateCommands(postLettersRequest, commonIds.value.supplierId),
        commonIds.value.correlationId,
        deps,
      );

      return {
        statusCode: 202,
        body: "",
      };
    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}
