import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

type LetterRecord = {
  id: string;
  status: string;
  updatedAt: string;
};

type UpdateLetterUpdatedAtInput = {
  id: string;
  updatedAt: string;
};

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2'}));

export async function getLetterById(
  tableName: string,
  id: string,
): Promise<LetterRecord | undefined> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        id,
        supplierId: 'xerox'
      }
    }),
  );

  return result.Item as LetterRecord;
}

export async function updateLetterUpdatedAt(
  tableName: string,
  letter: UpdateLetterUpdatedAtInput,
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        id: letter.id,
        supplierId: 'xerox'
      },
      UpdateExpression: "SET updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":updatedAt": letter.updatedAt,
      },
      ConditionExpression: "attribute_exists(id)",
    }),
  );
}
