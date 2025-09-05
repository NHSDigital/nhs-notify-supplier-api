import { APIGatewayProxyHandler } from "aws-lambda";
import { getLettersForSupplier } from "../services/letter-operations";
import { createLetterRepository } from "../infrastructure/letter-repo-factory";
import { LetterBase } from "../../../../internal/datastore/src";
import pino from 'pino';

const letterRepo = createLetterRepository();
const log = pino();

export const getLetters: APIGatewayProxyHandler = async (event) => {
  if (event.path === "/letters") {
    const supplierId = event.headers ? event.headers["NHSD-Supplier-ID"] : undefined;

    if (!supplierId) {
      log.info({
        description: 'Supplier ID not provided'
      });
      return {
        statusCode: 400,
        body: "Bad Request: Missing supplier ID",
      };
    }

    // The endpoint should only return pending letters for now
    const status = "PENDING";

    let limit = event.queryStringParameters?.limit;

    if (!limit) {
      limit = "10";
    }

    const letters = await getLettersForSupplier(
      supplierId,
      status,
      Number(limit),
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
        status: letter.status,
        reasonCode: letter.reasonCode,
        reasonText: letter.reasonText,
      },
    })),
  };
}
