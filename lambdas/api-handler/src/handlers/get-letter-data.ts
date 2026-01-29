import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty } from "../utils/validation";
import { extractCommonIds } from "../utils/common-ids";
import { ApiErrorDetail } from "../contracts/errors";
import { processError } from "../mappers/error-mapper";
import ValidationError from "../errors/validation-error";
import { getLetterDataUrl } from "../services/letter-operations";
import type { Deps } from "../config/deps";

export default function createGetLetterDataHandler(
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

      const presignedUrl = await getLetterDataUrl(
        commonIds.value.supplierId,
        letterId,
        deps,
      );

      deps.logger.info({
        description: "Generated presigned URL",
        supplierId: commonIds.value.supplierId,
        letterId,
        correlationId: commonIds.value.correlationId,
      });

      return {
        statusCode: 303,
        headers: {
          Location: presignedUrl,
        },
        body: "",
      };
    } catch (error) {
      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}
