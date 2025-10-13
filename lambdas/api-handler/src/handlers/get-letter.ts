import pino from "pino";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { APIGatewayProxyHandler } from "aws-lambda";
import { assertNotEmpty, lowerCaseKeys } from "../utils/validation";
import { lambdaConfig } from "../config/lambda-config";
import { ValidationError } from "../errors";
import { ApiErrorDetail } from "../contracts/errors";
import { getLetterById } from "../services/letter-operations";
import { mapErrorToResponse } from "../mappers/error-mapper";
import { mapToGetLetterResponse } from "../mappers/letter-mapper";


const letterRepo = createLetterRepository();
const log = pino();

export const getLetter: APIGatewayProxyHandler = async (event) => {

    let correlationId;
    try {
      assertNotEmpty(event.headers, new Error("The request headers are empty"));
      const lowerCasedHeaders = lowerCaseKeys(event.headers);

      correlationId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.APIM_CORRELATION_HEADER],
        new Error("The request headers don't contain the APIM correlation id"));

      const supplierId = assertNotEmpty(lowerCasedHeaders[lambdaConfig.SUPPLIER_ID_HEADER],
        new ValidationError(ApiErrorDetail.InvalidRequestMissingSupplierId));

      const letterId = assertNotEmpty(event.pathParameters?.id, new ValidationError(ApiErrorDetail.InvalidRequestMissingLetterIdPathParameter));

      const letter = await getLetterById(supplierId, letterId, letterRepo);

      const response = mapToGetLetterResponse(letter);

      log.info({
        description: 'Letter successfully fetched by id',
        supplierId,
        letterId
      });

      return {
        statusCode: 200,
        body: JSON.stringify(response, null, 2),
      };
    } catch (error)
    {
      return mapErrorToResponse(error, correlationId);
    }
}
