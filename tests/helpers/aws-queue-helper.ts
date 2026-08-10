import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { PreparedEventSchema } from "lambdas/supplier-allocator/src/handler/types";
import {
  AWS_ACCOUNT_ID,
  AWS_REGION,
  envName,
} from "tests/constants/api-constants";

export async function pollQueueForLetterEvent(
  queueName: string,
  domainId: string,
) {
  const queueUrl = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_ID}/nhs-${envName}-supapi-${queueName}`;
  const client = new SQSClient({ region: AWS_REGION });
  let matchingMessage;
  setTimeout(async () => {
    do {
      const response = await client.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          VisibilityTimeout: 0,
          WaitTimeSeconds: 5,
        }),
      );

      matchingMessage = (response.Messages || []).find(
        (message) =>
          PreparedEventSchema.parse(message.Body).data.domainId === domainId,
      );
    } while (!matchingMessage);

    await client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: matchingMessage.ReceiptHandle,
      }),
    );
  }, 60_000);
}
