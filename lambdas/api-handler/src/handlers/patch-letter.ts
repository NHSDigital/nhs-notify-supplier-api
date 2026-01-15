import { APIGatewayProxyHandler } from "aws-lambda";
import { enqueueLetterUpdateRequests } from "../services/letter-operations";
import {
  PatchLetterRequest,
  PatchLetterRequestSchema,
  UpdateLetterCommand,
} from "../contracts/letters";
import { ApiErrorDetail } from "../contracts/errors";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { mapToUpdateCommand } from "../mappers/letter-mapper";
import type { Deps } from "../config/deps";

export default function createPatchLetterHandler(
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
      const letterId = assertNotEmpty(
        event.pathParameters?.id,
        new ValidationError(
          ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter,
        ),
      );
      const body = assertNotEmpty(
        event.body,
        new ValidationError(ApiErrorDetail.InvalidRequestMissingBody),
      );

      let patchLetterRequest: PatchLetterRequest;

      try {
        patchLetterRequest = PatchLetterRequestSchema.parse(JSON.parse(body));
      } catch (error) {
        const typedError =
          error instanceof Error
            ? new ValidationError(ApiErrorDetail.InvalidRequestBody, {
                cause: error,
              })
            : error;
        throw typedError;
      }

      const updateLetterCommand: UpdateLetterCommand = mapToUpdateCommand(
        patchLetterRequest,
        commonIds.value.supplierId,
      );

      if (updateLetterCommand.id !== letterId) {
        throw new ValidationError(
          ApiErrorDetail.InvalidRequestLetterIdsMismatch,
        );
      }

      await enqueueLetterUpdateRequests(
        [updateLetterCommand],
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
