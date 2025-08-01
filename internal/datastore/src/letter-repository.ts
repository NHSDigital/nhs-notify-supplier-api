import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { Letter, LetterDB, LetterSchema } from './types';
import { Logger } from 'pino';

export type PagingOptions = Partial<{
  exclusiveStartKey: Record<string, any>,
  pageSize: number
}>

const defaultPagingOptions = {
  pageSize: 50
};

export class LetterRepository {
  constructor(readonly ddbClient: DynamoDBDocumentClient,
              readonly log: Logger,
              readonly config: { lettersTableName: string }) {
  }

  async putLetter(letter: Letter): Promise<LetterDB> {
    const letterDb: LetterDB = {
      ...letter,
      supplierStatus: `${letter.supplierId}#${letter.status}`
    };
    try {
      await this.ddbClient.send(new PutCommand({
        TableName: this.config.lettersTableName,
        Item: letterDb,
        ConditionExpression: 'attribute_not_exists(id)', // Ensure id is unique
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Letter with id ${letter.id} already exists for supplier ${letter.supplierId}`);
      }
      throw error;
    }
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

  async getLettersByStatus(supplierId: string, status: Letter['status'], options?: PagingOptions): Promise<{
    letters: Letter[],
    lastEvaluatedKey?: Record<string, any>
  }> {

    const extendedOptions = { ...defaultPagingOptions, ...options };

    const result = await this.ddbClient.send(new QueryCommand({
      TableName: this.config.lettersTableName,
      IndexName: 'supplierStatus-index',
      KeyConditions: {
        supplierStatus: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [`${supplierId}#${status}`]
        }
      },
      Limit: extendedOptions.pageSize,
      ExclusiveStartKey: extendedOptions.exclusiveStartKey
    }));

    return {
      // Items is an empty array if no items match the query
      letters: result.Items!.map(item => LetterSchema.safeParse(item))
        .filter((result) => {
          if (!result.success) {
            this.log.warn(`Invalid letter data: ${result.error}`);
          }
          return result.success;
        })
        .map(result => result.data),
      lastEvaluatedKey: result.LastEvaluatedKey
    }
  }

  async updateLetterStatus(supplierId: string, letterId: string, status: Letter['status']): Promise<Letter> {
    this.log.debug(`Updating letter ${letterId} to status ${status}`);
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

    this.log.debug(`Updated letter ${letterId} to status ${status}`);
    return LetterSchema.parse(result.Attributes);
  }
}
