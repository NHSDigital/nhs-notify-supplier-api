import { SNSClient } from "@aws-sdk/client-sns";
import * as pino from "pino";
import { createHandler } from "../letter-updates-transformer";
import { KinesisStreamEvent, Context, KinesisStreamRecordPayload } from "aws-lambda";
import { mockDeep } from "jest-mock-extended";
import { Deps } from "../deps";
import { EnvVars } from "../env";
import { LetterBase } from "@internal/datastore";
import { mapLetterToCloudEvent } from "../mappers/letter-mapper";

// Make crypto return consistent values, since we"re calling it in both prod and test code and comparing the values
const realCrypto = jest.requireActual("crypto");
const randomBytes: Record<string, any> = {"8": realCrypto.randomBytes(8), "16": realCrypto.randomBytes(16)}
jest.mock("crypto", () => ({
  randomUUID: () => "4616b2d9-b7a5-45aa-8523-fa7419626b69",
  randomBytes: (size: number) => randomBytes[String(size)]
}));

describe("letter-updates-transformer Lambda", () => {

  const mockedDeps: jest.Mocked<Deps> = {
  snsClient: { send: jest.fn()} as unknown as SNSClient,
  logger: { info: jest.fn(), error: jest.fn() } as unknown as pino.Logger,
    env: {
      EVENTPUB_SNS_TOPIC_ARN: "arn:aws:sns:region:account:topic",
    } as unknown as EnvVars
  } as Deps;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  })

  it("processes Kinesis events and publishes them to SNS", async () => {

    const handler = createHandler(mockedDeps);
    const letters = generateLetters(1);
    const expectedEntries = [expect.objectContaining({Message: JSON.stringify(mapLetterToCloudEvent(letters[0]))})];

    await handler(generateKinesisEvent(letters), mockDeep<Context>(), jest.fn());

    expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        TopicArn: "arn:aws:sns:region:account:topic",
        PublishBatchRequestEntries: expectedEntries,
      })
    }));
  });

  it ("batches mutiple records into a single call to SNS", async () => {

    const handler = createHandler(mockedDeps);
    const letters = generateLetters(10);
    const expectedEntries = letters.map(letter =>
      expect.objectContaining({Message: JSON.stringify(mapLetterToCloudEvent(letter))}));

    await handler(generateKinesisEvent(letters), mockDeep<Context>(), jest.fn());

    expect(mockedDeps.snsClient.send).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({
        TopicArn: "arn:aws:sns:region:account:topic",
        PublishBatchRequestEntries: expectedEntries,
      })
    }));
  });

  it("respects SNS's maximumum batch size of 10", async () => {

    const handler = createHandler(mockedDeps);
    const letters = generateLetters(21);
    const expectedEntries = [
      letters.slice(0, 10).map(
        (letter, index) => expect.objectContaining({
          Id: expect.stringMatching(new RegExp(`-${index}$`)),
          Message: JSON.stringify(mapLetterToCloudEvent(letter))})),
      letters.slice(10, 20).map(
        (letter, index) => expect.objectContaining({
          Id: expect.stringMatching(new RegExp(`-${index}$`)),
          Message: JSON.stringify(mapLetterToCloudEvent(letter))})),
      letters.slice(20).map(
        (letter, index) => expect.objectContaining({
          Id: expect.stringMatching(new RegExp(`-${index}$`)),
          Message: JSON.stringify(mapLetterToCloudEvent(letter))})),
    ];

    await handler(generateKinesisEvent(letters), mockDeep<Context>(), jest.fn());

    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[0],
        })}));
    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[1],
        })}));
    expect(mockedDeps.snsClient.send).toHaveBeenNthCalledWith(3,
      expect.objectContaining({
        input: expect.objectContaining({
          TopicArn: "arn:aws:sns:region:account:topic",
          PublishBatchRequestEntries: expectedEntries[2],
        })}));
  });


  function generateLetters(numLetters: number): LetterBase[] {
    return  Array.from(Array(numLetters).keys())
      .map(i => ({ id: String(i + 1), status: "PRINTED", specificationId: "spec1", groupId: "group1" }));
  }

  function generateKinesisEvent(letterEvents: Object[]): KinesisStreamEvent {
    const records = letterEvents
      .map(letter => Buffer.from(JSON.stringify(letter)).toString("base64"))
      .map(data => ({kinesis: {data}} as unknown as KinesisStreamRecordPayload));

    return {Records: records} as unknown as KinesisStreamEvent;
  }
});
