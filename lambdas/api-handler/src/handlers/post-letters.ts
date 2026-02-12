import { APIGatewayProxyHandler } from "aws-lambda";
import { Unit } from "aws-embedded-metrics";
import pino from "pino";
import type { Deps } from "../config/deps";
import { ApiErrorDetail } from "../contracts/errors";
import {
  PostLettersRequest,
  PostLettersRequestSchema,
  UpdateLetterCommand,
} from "../contracts/letters";
import ValidationError from "../errors/validation-error";
import { processError } from "../mappers/error-mapper";
import { mapToUpdateCommands } from "../mappers/letter-mapper";
import { enqueueLetterUpdateRequests } from "../services/letter-operations";
import { extractCommonIds } from "../utils/common-ids";
import { assertNotEmpty, requireEnvVar } from "../utils/validation";
import { MetricEntry, MetricStatus, buildEMFObject } from "../utils/metrics";

function duplicateIdsExist(postLettersRequest: PostLettersRequest) {
  const ids = postLettersRequest.data.map((item) => item.id);
  return new Set(ids).size !== ids.length;
}

/**
 * emits metrics of successful letter updates, including the supplier and grouped by status
 */
function emitSuccessMetrics(
  supplierId: string,
  statusesMapping: Map<string, number>,
  logger: pino.Logger,
) {
  for (const [status, count] of statusesMapping) {
    const dimensions: Record<string, string> = {
      supplier: supplierId,
      eventType: status,
    };
    const metric: MetricEntry = {
      key: "Letters posted",
      value: count,
      unit: Unit.Count,
    };
    const emf = buildEMFObject("postLetters", dimensions, metric);
    logger.info(emf);
    logger.info(`process.env: ${JSON.stringify(process.env)}`);
  }
}

function populateStatusesMap(updateLetterCommands: UpdateLetterCommand[]) {
  const statusMap = new Map<string, number>();
  for (const command of updateLetterCommands) {
    statusMap.set(command.status, (statusMap.get(command.status) || 0) + 1);
  }
  return statusMap;
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

    const { supplierId } = commonIds.value;
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

      const updateLetterCommands: UpdateLetterCommand[] = mapToUpdateCommands(
        postLettersRequest,
        supplierId,
      );
      const statusesMapping = populateStatusesMap(updateLetterCommands);
      await enqueueLetterUpdateRequests(
        updateLetterCommands,
        commonIds.value.correlationId,
        deps,
      );

      emitSuccessMetrics(supplierId, statusesMapping, deps.logger);
      return {
        statusCode: 202,
        body: "",
      };
    } catch (error) {
      // error metrics
      emitErrorMetrics(supplierId, deps.logger);

      return processError(error, commonIds.value.correlationId, deps.logger);
    }
  };
}

function emitErrorMetrics(supplierId: string, logger: pino.Logger) {
  const dimensions: Record<string, string> = { supplier: supplierId };
  const metric: MetricEntry = {
    key: MetricStatus.Failure,
    value: 1,
    unit: Unit.Count,
  };
  const emf = buildEMFObject("postLetters", dimensions, metric);
  logger.info(emf);
}
