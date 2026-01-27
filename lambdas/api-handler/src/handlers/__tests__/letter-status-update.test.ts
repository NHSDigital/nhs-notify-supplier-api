import { Context, SQSEvent, SQSRecord } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import pino from "pino";
import { SNSClient } from "@aws-sdk/client-sns";
import { Letter, LetterRepository } from "@internal/datastore/src";
import { UpdateLetterCommand } from "../../contracts/letters";
import { EnvVars } from "../../config/env";
import { Deps } from "../../config/deps";
import createLetterStatusUpdateHandler from "../letter-status-update";

// Make crypto return consistent values, since we"re calling it in both prod and test code and comparing the values
const realCrypto = jest.requireActual("crypto");
const randomBytes: Record<string, any> = {
  "8": realCrypto.randomBytes(8),
  "16": realCrypto.randomBytes(16),
};
jest.mock("crypto", () => ({
  randomUUID: () => "4616b2d9-b7a5-45aa-8523-fa7419626b69",
  randomBytes: (size: number) => randomBytes[String(size)],
}));

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
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  const mockedDeps: jest.Mocked<Deps> = {
    snsClient: { send: jest.fn() } as unknown as SNSClient,
    letterRepo: {
      getLetterById: jest.fn(),
    } as unknown as LetterRepository,
    logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      EVENT_SOURCE: "supplier-api",
      SNS_TOPIC_ARN: "sns_topic.arn",
    } as unknown as EnvVars,
  } as Deps;

  const letters: Letter[] = [
    {
      id: "id1",
      supplierId: "s1",
      status: "PENDING",
    } as Letter,
    {
      id: "id2",
      supplierId: "s2",
      status: "PENDING",
    } as Letter,
    {
      id: "id3",
      supplierId: "s3",
      status: "PENDING",
    } as Letter,
  ];

  const updateLetterCommands: UpdateLetterCommand[] = [
    {
      ...letters[0],
      status: "REJECTED",
      reasonCode: "123",
      reasonText: "Reason text",
    },
    { ...letters[1], status: "ACCEPTED" },
    { ...letters[2], status: "DELIVERED" },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("processes letters successfully", async () => {
    (mockedDeps.letterRepo.getLetterById as jest.Mock)
      .mockResolvedValueOnce(letters[0])
      .mockResolvedValueOnce(letters[1])
      .mockResolvedValueOnce(letters[2]);

    const context = mockDeep<Context>();
    const callback = jest.fn();

    const letterStatusUpdateHandler =
      createLetterStatusUpdateHandler(mockedDeps);
    await letterStatusUpdateHandler(
      buildEvent(updateLetterCommands),
      context,
      callback,
    );

    expect(mockedDeps.snsClient.send).toHaveBeenCalled();
  });

  it("logs error if error thrown when updating", async () => {
    const mockError = new Error("Update error");
    (mockedDeps.snsClient.send as jest.Mock).mockRejectedValue(mockError);
    (mockedDeps.letterRepo.getLetterById as jest.Mock).mockResolvedValueOnce(
      letters[1],
    );

    const context = mockDeep<Context>();
    const callback = jest.fn();

    const letterStatusUpdateHandler =
      createLetterStatusUpdateHandler(mockedDeps);
    await letterStatusUpdateHandler(
      buildEvent([updateLetterCommands[1]]),
      context,
      callback,
    );

    expect(mockedDeps.logger.error).toHaveBeenCalledWith(
      {
        err: mockError,
        messageId: "mid-id2",
        correlationId: "correlationId-id2",
        messageBody: '{"id":"id2","supplierId":"s2","status":"ACCEPTED"}',
      },
      "Error processing letter status update",
    );
  });

  it("returns batch update failures in the response", async () => {
    (mockedDeps.letterRepo.getLetterById as jest.Mock)
      .mockResolvedValueOnce(letters[0])
      .mockResolvedValueOnce(letters[1])
      .mockResolvedValueOnce(letters[2]);
    (mockedDeps.snsClient.send as jest.Mock).mockResolvedValueOnce({});
    (mockedDeps.snsClient.send as jest.Mock).mockRejectedValueOnce(
      new Error("Update error"),
    );
    (mockedDeps.snsClient.send as jest.Mock).mockResolvedValueOnce({});

    const letterStatusUpdateHandler =
      createLetterStatusUpdateHandler(mockedDeps);
    const sqsBatchResponse = await letterStatusUpdateHandler(
      buildEvent(updateLetterCommands),
      mockDeep<Context>(),
      jest.fn(),
    );

    expect(sqsBatchResponse?.batchItemFailures.length).toBeGreaterThan(0);
  });
});
