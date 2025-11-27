import { APIGatewayProxyHandler } from "aws-lambda";
import postMIOperation from "../services/mi-operations";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty, validateIso8601Timestamp } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { PostMIRequest, PostMIRequestSchema } from "../contracts/mi";
import { mapToMI } from "../mappers/mi-mapper";
import { Deps } from "../config/deps";

export default function createPostMIHandler(
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

    try {
      const body = assertNotEmpty(
        event.body,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
      );

      let postMIRequest: PostMIRequest;

      try {
        postMIRequest = PostMIRequestSchema.parse(JSON.parse(body));
      } catch (error) {
        const typedError =
          error instanceof Error
            ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                cause: error,
              })
            : error;
        throw typedError;
      }
      validateIso8601Timestamp(postMIRequest.data.attributes.timestamp);

      const result = await postMIOperation(
        mapToMI(postMIRequest, commonIds.value.supplierId),
        deps.miRepo,
      );

      return {
        statusCode: 201,
        body: JSON.stringify(result, null, 2),
      };
    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}
