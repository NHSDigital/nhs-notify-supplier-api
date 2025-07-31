import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { Letter, LetterDB, LetterDBSchema, LetterSchema } from './types';

export class LetterRepository {
  constructor(readonly ddbClient: DynamoDBDocumentClient,
              readonly config: { lettersTableName: string }) {
  }

  async putLetter(letter: Letter): Promise<LetterDB> {
    const letterDb: LetterDB = {
      ...letter,
      supplierStatus: `${letter.supplierId}#${letter.status}`
    };
    await this.ddbClient.send(new PutCommand({
      TableName: this.config.lettersTableName,
      Item: letterDb,
      ConditionExpression: 'attribute_not_exists(id)', // Ensure id is unique
    }));

    return letterDb;
  }

  async getLetterById(supplierId: string, letterId: string): Promise<Letter> {
    const result = await this.ddbClient.send(new GetCommand({
      TableName: this.config.lettersTableName,
      Key: {
        supplierId: supplierId,
        id: letterId
      }
    }));

    if (!result.Item) {
      throw new Error(`Letter with id ${letterId} not found for supplier ${supplierId}`);
    }
    return LetterSchema.parse(result.Item);
  }

  async getLettersByStatus(supplierId: string, status: Letter['status'], exclusiveStartKey?: Record<string, any>, pageSize: number = 50): Promise<{
    letters: Letter[],
    lastEvaluatedKey?: Record<string, any>
  }> {
    const result = await this.ddbClient.send(new QueryCommand({
      TableName: this.config.lettersTableName,
      IndexName: 'supplierStatus-index',
      KeyConditions: {
        supplierStatus: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [`${supplierId}#${status}`]
        }
      },
      Limit: pageSize,
      ExclusiveStartKey: exclusiveStartKey
    }));

    if (!result.Items) {
      throw new Error(`No letters found for supplier ${supplierId} with status ${status}`);
    }
    return {
      letters: result.Items.map(item => LetterSchema.parse(item)),
      lastEvaluatedKey: result.LastEvaluatedKey
    }
  }

  async updateLetterStatus(supplierId: string, letterId: string, status: Letter['status']): Promise<Letter> {
    console.debug(`Updating letter ${letterId} to status ${status}`);
    let result: UpdateCommandOutput;
    try {
      result = await this.ddbClient.send(new UpdateCommand({
        TableName: this.config.lettersTableName,
        Key: {
          supplierId: supplierId,
          id: letterId
        },
        UpdateExpression: 'set #status = :status, updatedAt = :updatedAt, supplierStatus = :supplierStatus',
        ConditionExpression: 'attribute_exists(id)', // Ensure letter exists
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
          ':supplierStatus': `${supplierId}#${status}`
        },
        ReturnValues: 'ALL_NEW'
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Letter with id ${letterId} not found for supplier ${supplierId}`);
      }
      throw error;
    }

    if (!result.Attributes) {
      throw new Error(`Letter with id ${letterId} not found for supplier ${supplierId}`);
    }
    console.debug(`Updated letter ${letterId} to status ${status}`);
    return LetterSchema.parse(result.Attributes);
  }
}
