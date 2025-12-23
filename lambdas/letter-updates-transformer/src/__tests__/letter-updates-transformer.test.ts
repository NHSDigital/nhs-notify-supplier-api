import { SNSClient } from "@aws-sdk/client-sns";
import * as pino from "pino";
import {
  Context,
  DynamoDBRecord,
  KinesisStreamEvent,
  KinesisStreamRecordPayload,
} from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { LetterBase } from "@internal/datastore";
import createHandler from "../letter-updates-transformer";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import mapLetterToCloudEvent from "../mappers/letter-mapper";
import { LetterStatus } from "../../../api-handler/src/contracts/letters";
import { LetterForEventPub } from "../types";

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

const eventSource =
  "/data-plane/supplier-api/nhs-supplier-api-dev/main/letters";
const mockedDeps: jest.Mocked<Deps> = {
  snsClient: { send: jest.fn() } as unknown as SNSClient,
  logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
  env: {
    EVENTPUB_SNS_TOPIC_ARN: "arn:aws:sns:region:account:topic",
    EVENT_SOURCE: eventSource,
  } as unknown as EnvVars,
} as Deps;

describe("letter-updates-transformer Lambda", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("filtering", () => {
    it("processes status changes and publishes them to SNS", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("ACCEPTED");
      const newLetter = generateLetter("PRINTED");
      const expectedEntries = [
        expect.objectContaining({
          Message: JSON.stringify(
            mapLetterToCloudEvent(newLetter, eventSource),
          ),
        }),
      ];

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries,
          }),
        }),
      );
    });

    it("publishes an event if a reason code is added", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("ACCEPTED");
      const newLetter = generateLetter("ACCEPTED");
      newLetter.reasonCode = "R1";
      const expectedEntries = [
        expect.objectContaining({
          Message: JSON.stringify(
            mapLetterToCloudEvent(newLetter, eventSource),
          ),
        }),
      ];

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries,
          }),
        }),
      );
    });

    it("publishes an event if a reason code is changed", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("ACCEPTED");
      const newLetter = generateLetter("ACCEPTED");
      oldLetter.reasonCode = "R1";
      newLetter.reasonCode = "R2";
      const expectedEntries = [
        expect.objectContaining({
          Message: JSON.stringify(
            mapLetterToCloudEvent(newLetter, eventSource),
          ),
        }),
      ];

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries,
          }),
        }),
      );
    });

    it("does not publish an event if neither status nor reason code changed", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("ACCEPTED");
      const newLetter = generateLetter("ACCEPTED");

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).not.toHaveBeenCalled();
    });

    it("publishes INSERT events", async () => {
      const handler = createHandler(mockedDeps);
      const newLetter = generateLetter("ACCEPTED");
      const expectedEntries = [
        expect.objectContaining({
          Message: JSON.stringify(
            mapLetterToCloudEvent(newLetter, eventSource),
          ),
        }),
      ];

      const testData = generateKinesisEvent([generateInsertRecord(newLetter)]);
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries,
          }),
        }),
      );
    });

    it("does not publish invalid letter data", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetter = generateLetter("ACCEPTED");
      const newLetter = { id: oldLetter.id } as LetterForEventPub;

      const testData = generateKinesisEvent([
        generateModifyRecord(oldLetter, newLetter),
      ]);
      await expect(
        handler(testData, mockDeep<Context>(), jest.fn()),
      ).rejects.toThrow();

      expect(mockedDeps.snsClient.send).not.toHaveBeenCalled();
    });
  });

  describe("Batching", () => {
    it("batches mutiple records into a single call to SNS", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetters = generateLetters(10, "ACCEPTED");
      const newLetters = generateLetters(10, "PRINTED");
      const expectedEntries = newLetters.map((letter) =>
        expect.objectContaining({
          Message: JSON.stringify(mapLetterToCloudEvent(letter, eventSource)),
        }),
      );

      const testData = generateKinesisEvent(
        oldLetters.map((oldLetter, i) =>
          generateModifyRecord(oldLetter, newLetters[i]),
        ),
      );
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries,
          }),
        }),
      );
    });

    it("respects SNS's maximumum batch size of 10", async () => {
      const handler = createHandler(mockedDeps);
      const oldLetters = generateLetters(21, "ACCEPTED");
      const newLetters = generateLetters(21, "PRINTED");
      const expectedEntries = [
        newLetters.slice(0, 10).map((letter, index) =>
          expect.objectContaining({
            Id: expect.stringMatching(new RegExp(`-${index}$`)),
            Message: JSON.stringify(mapLetterToCloudEvent(letter, eventSource)),
          }),
        ),
        newLetters.slice(10, 20).map((letter, index) =>
          expect.objectContaining({
            Id: expect.stringMatching(new RegExp(`-${index}$`)),
            Message: JSON.stringify(mapLetterToCloudEvent(letter, eventSource)),
          }),
        ),
        newLetters.slice(20).map((letter, index) =>
          expect.objectContaining({
            Id: expect.stringMatching(new RegExp(`-${index}$`)),
            Message: JSON.stringify(mapLetterToCloudEvent(letter, eventSource)),
          }),
        ),
      ];

      const testData = generateKinesisEvent(
        oldLetters.map((oldLetter, i) =>
          generateModifyRecord(oldLetter, newLetters[i]),
        ),
      );
      await handler(testData, mockDeep<Context>(), jest.fn());

      expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries[0],
          }),
        }),
      );
      expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries[1],
          }),
        }),
      );
      expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: "arn:aws:sns:region:account:topic",
            PublishBatchRequestEntries: expectedEntries[2],
          }),
        }),
      );
    });
  });
});

function generateLetter(status: LetterStatus, id?: string): LetterForEventPub {
  return {
    id: id || "1",
    status,
    specificationId: "spec1",
    supplierId: "supplier1",
    groupId: "group1",
    updatedAt: "2025-12-10T11:13:54Z",
  };
}

function generateLetters(
  numLetters: number,
  status: LetterStatus,
): LetterForEventPub[] {
  const letters: LetterForEventPub[] = Array.from({ length: numLetters });
  for (let i = 0; i < numLetters; i++) {
    letters[i] = generateLetter(status, String(i + 1));
  }
  return letters;
}

function generateModifyRecord(
  oldLetter: LetterForEventPub,
  newLetter: LetterForEventPub,
): DynamoDBRecord {
  const oldImage = Object.fromEntries(
    Object.entries(oldLetter).map(([key, value]) => [key, { S: value }]),
  );
  const newImage = Object.fromEntries(
    Object.entries(newLetter).map(([key, value]) => [key, { S: value }]),
  );
  return {
    eventName: "MODIFY",
    dynamodb: { OldImage: oldImage, NewImage: newImage },
  };
}

function generateInsertRecord(newLetter: LetterBase): DynamoDBRecord {
  const newImage = Object.fromEntries(
    Object.entries(newLetter).map(([key, value]) => [key, { S: value }]),
  );
  return {
    eventName: "INSERT",
    dynamodb: { NewImage: newImage },
  };
}

function generateKinesisEvent(letterEvents: object[]): KinesisStreamEvent {
  const records = letterEvents
    .map((letter) => Buffer.from(JSON.stringify(letter)).toString("base64"))
    .map(
      (data) =>
        ({ kinesis: { data } }) as unknown as KinesisStreamRecordPayload,
    );

  return { Records: records } as unknown as KinesisStreamEvent;
}
