import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { S3Client } from "@aws-sdk/client-s3";
import pino from "pino";
import { LetterRepository } from "@internal/datastore/src";
import { UpdateLetterCommand } from "../../contracts/letters";
import { EnvVars } from "../../config/env";
import { Deps } from "../../config/deps";
import createLetterStatusUpdateHandler from "../letter-status-update";

const buildEvent = (updateLetterCommand: UpdateLetterCommand[]): SQSEvent => {
  const records: Partial<SQSRecord>[] = updateLetterCommand.map((letter) => {
    return {
      messageId: `mid-${letter.id}`,
      body: JSON.stringify(letter),
      messageAttributes: {
        CorrelationId: {
          dataType: "String",
          stringValue: `correlationId-${letter.id}`,
        },
      },
    };
  });

  const event: Partial<SQSEvent> = {
    Records: records as SQSRecord[],
  };

  return event as SQSEvent;
};

describe("createLetterStatusUpdateHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("processes letters successfully", async () => {
    const updateLetterCommands: UpdateLetterCommand[] = [
      {
        id: "id1",
        status: "REJECTED",
        supplierId: "s1",
        reasonCode: "123",
        reasonText: "Reason text",
      },
      {
        id: "id2",
        supplierId: "s2",
        status: "ACCEPTED",
      },
      {
        id: "id3",
        supplierId: "s3",
        status: "DELIVERED",
      },
    ];

    const mockedDeps: jest.Mocked<Deps> = {
      s3Client: {} as unknown as S3Client,
      letterRepo: {
        updateLetterStatus: jest
          .fn()
          .mockResolvedValueOnce(updateLetterCommands[0])
          .mockResolvedValueOnce(updateLetterCommands[1])
          .mockResolvedValueOnce(updateLetterCommands[2]),
      } as unknown as LetterRepository,
      logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
      env: {
        SUPPLIER_ID_HEADER: "nhsd-supplier-id",
        APIM_CORRELATION_HEADER: "nhsd-correlation-id",
        LETTERS_TABLE_NAME: "LETTERS_TABLE_NAME",
        LETTER_TTL_HOURS: 12_960,
        DOWNLOAD_URL_TTL_SECONDS: 60,
        MAX_LIMIT: 2500,
        QUEUE_URL: "SQS_URL",
      } as unknown as EnvVars,
    } as Deps;

    const context = mockDeep<Context>();
    const callback = jest.fn();

    const letterStatusUpdateHandler =
      createLetterStatusUpdateHandler(mockedDeps);
    await letterStatusUpdateHandler(
      buildEvent(updateLetterCommands),
      context,
      callback,
    );

    expect(mockedDeps.letterRepo.updateLetterStatus).toHaveBeenNthCalledWith(
      1,
      updateLetterCommands[0],
    );
    expect(mockedDeps.letterRepo.updateLetterStatus).toHaveBeenNthCalledWith(
      2,
      updateLetterCommands[1],
    );
    expect(mockedDeps.letterRepo.updateLetterStatus).toHaveBeenNthCalledWith(
      3,
      updateLetterCommands[2],
    );
  });

  it("logs error if error thrown when updating", async () => {
    const mockError = new Error("Update error");

    const mockedDeps: jest.Mocked<Deps> = {
      s3Client: {} as unknown as S3Client,
      letterRepo: {
        updateLetterStatus: jest.fn().mockRejectedValue(mockError),
      } as unknown as LetterRepository,
      logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
      env: {
        SUPPLIER_ID_HEADER: "nhsd-supplier-id",
        APIM_CORRELATION_HEADER: "nhsd-correlation-id",
        LETTERS_TABLE_NAME: "LETTERS_TABLE_NAME",
        LETTER_TTL_HOURS: 12_960,
        DOWNLOAD_URL_TTL_SECONDS: 60,
        MAX_LIMIT: 2500,
        QUEUE_URL: "SQS_URL",
      } as unknown as EnvVars,
    } as Deps;

    const context = mockDeep<Context>();
    const callback = jest.fn();

    const updateLetterCommands: UpdateLetterCommand[] = [
      {
        id: "id1",
        status: "ACCEPTED",
        supplierId: "s1",
      },
    ];

    const letterStatusUpdateHandler =
      createLetterStatusUpdateHandler(mockedDeps);
    await letterStatusUpdateHandler(
      buildEvent(updateLetterCommands),
      context,
      callback,
    );

    expect(mockedDeps.letterRepo.updateLetterStatus).toHaveBeenCalledWith(
      updateLetterCommands[0],
    );
    expect(mockedDeps.logger.error).toHaveBeenCalledWith(
      {
        err: mockError,
        messageId: "mid-id1",
        correlationId: "correlationId-id1",
        messageBody: '{"id":"id1","status":"ACCEPTED","supplierId":"s1"}',
      },
      "Error processing letter status update",
    );
  });
});
