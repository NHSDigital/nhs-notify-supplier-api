import { APIGatewayProxyHandler } from "aws-lambda";
import { getLettersForSupplier } from "../services/letter-operations";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { LetterBase } from "../../../../internal/datastore/src";
import pino from 'pino';

const letterRepo = createLetterRepository();
const log = pino();
const DEFAULT_LIMIT = process.env.DEFAULT_LIMIT || '2500';

export const getLetters: APIGatewayProxyHandler = async (event) => {
  if (event.path === "/letters") {
    const supplierId = event.headers ? event.headers["NHSD-Supplier-ID"] : undefined;

    if (!supplierId) {
      log.info({
        description: 'Supplier ID not provided'
      });
      return {
        statusCode: 400,
        body: "Invalid Request: Missing supplier ID",
      };
    }

    // The endpoint should only return pending letters for now
    const status = "PENDING";

    if (
      event.queryStringParameters &&
      Object.keys(event.queryStringParameters).some(
        (key) => key !== "limit"
      )
    ) {
      log.info({
        description: "Unexpected query parameter(s) present",
        queryStringParameters: event.queryStringParameters,
      });

      return {
        statusCode: 400,
        body: "Invalid Request: Only 'limit' query parameter is supported",
      };
    }

    let limit = event.queryStringParameters?.limit || DEFAULT_LIMIT;

    let limitNumber = Number(limit);

    if (isNaN(limitNumber)) {
      log.info({
        description: "limit parameter is not a number",
        limit,
      });
      return {
        statusCode: 400,
        body: "Invalid Request: limit parameter must be a positive number not greater than 2500",
      };
    }

    if (limitNumber < 0 || limitNumber > 2500) {
      log.info({
        description: "Limit value is invalid",
        limit,
      });
      return {
        statusCode: 400,
        body: "Invalid Request: limit parameter must be a positive number not greater than 2500",
      };
    }

    const letters = await getLettersForSupplier(
      supplierId,
      status,
      limitNumber,
      letterRepo,
    );

    const response = createGetLettersResponse(letters);

    log.info({
      description: 'Pending letters successfully fetched',
      supplierId,
      limit,
      status,
      lettersCount: letters.length
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
    };
  }

  log.warn({
    description: 'Unsupported event path',
    path: event.path
  });

  return {
    statusCode: 404,
    body: "Not Found",
  };
};

interface GetLettersResponse {
  data: Array<{
    type: "Letter";
    id: string;
    attributes: {
      specificationId: string;
      groupId: string;
      status: string;
      reasonCode?: number;
      reasonText?: string;
    };
  }>;
}

function createGetLettersResponse(letters: LetterBase[]): GetLettersResponse {
  return {
    data: letters.map((letter) => ({
      id: letter.id,
      type: "Letter",
      attributes: {
        specificationId: letter.specificationId,
        groupId: letter.groupId,
        status: letter.status,
        reasonCode: letter.reasonCode,
        reasonText: letter.reasonText,
      },
    })),
  };
}
