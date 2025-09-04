import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { Letter, LetterBase, LetterSchema, LetterSchemaBase } from './types';
import { Logger } from 'pino';
import { z } from 'zod';

export type PagingOptions = Partial<{
  exclusiveStartKey: Record<string, any>,
  pageSize: number
}>

const defaultPagingOptions = {
  pageSize: 50
};

export type LetterRepositoryConfig = {
  lettersTableName: string,
  ttlHours: number
}

export class LetterRepository {
  constructor(readonly ddbClient: DynamoDBDocumentClient,
              readonly log: Logger,
              readonly config: LetterRepositoryConfig) {
  }

  async putLetter(letter: Omit<Letter, 'ttl' | 'supplierStatus' | 'supplierStatusSk'>): Promise<Letter> {
    const letterDb: Letter = {
      ...letter,
      supplierStatus: `${letter.supplierId}#${letter.status}`,
      supplierStatusSk: letter.id,
      ttl: Math.floor(Date.now() / 1000 + 60 * 60 * this.config.ttlHours)
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
    return LetterSchema.parse(letterDb);
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
      KeyConditionExpression: 'supplierStatus = :supplierStatus',
      ExpressionAttributeValues: { ':supplierStatus': `${supplierId}#${status}` },
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
        UpdateExpression: 'set #status = :status, updatedAt = :updatedAt, supplierStatus = :supplierStatus, #ttl = :ttl',
        ConditionExpression: 'attribute_exists(id)', // Ensure letter exists
        ExpressionAttributeNames: {
          '#status': 'status',
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
          ':supplierStatus': `${supplierId}#${status}`,
          ':ttl': Math.floor(Date.now() / 1000 + 60 * 60 * this.config.ttlHours)
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

  async getLettersBySupplier(supplierId: string, status: string, size: number): Promise<LetterBase[]> {
    const supplierStatus = `${supplierId}#${status}`;
    const result = await this.ddbClient.send(new QueryCommand({
      TableName: this.config.lettersTableName,
      IndexName: 'supplierStatus-index',
      KeyConditionExpression: 'supplierStatus = :supplierStatus',
      Limit: size,
      ExpressionAttributeNames: {
        '#status': 'status' // reserved keyword
      },
      ExpressionAttributeValues: {
        ':supplierStatus': supplierStatus
      },
      ProjectionExpression: 'id, #status, specificationId, reasonCode, reasonText'
    }));
    return z.array(LetterSchemaBase).parse(result.Items ?? []);
  }
}
