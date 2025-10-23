import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  BatchWriteCommand,
  QueryCommand,
  UpdateCommand,
  UpdateCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { Letter, LetterBase, LetterSchema, LetterSchemaBase } from './types';
import { Logger } from 'pino';
import { z } from 'zod';
import { LetterDto } from '../../../lambdas/api-handler/src/contracts/letters';

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
      supplierStatusSk: new Date().toISOString(),
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

  async putLetterBatch(letters: Omit<Letter, 'ttl' | 'supplierStatus'| 'supplierStatusSk'>[]): Promise<void> {
    let lettersDb: Letter[] = [];
    for (let i = 0; i < letters.length; i++) {

      const letter = letters[i];

      if(!letter){
        continue;
      }

      lettersDb.push({
        ...letter,
        supplierStatus: `${letter.supplierId}#${letter.status}`,
        supplierStatusSk: Date.now().toString(),
        ttl: Math.floor(Date.now() / 1000 + 60 * 60 * this.config.ttlHours)
      });

      if (lettersDb.length === 25 || i === letters.length - 1) {
        const input = {
          RequestItems: {
            [this.config.lettersTableName]: lettersDb.map((item: any) => ({
              PutRequest: {
                Item: item
              }
            }))
          }
        };

        await this.ddbClient.send(new BatchWriteCommand(input));

        lettersDb = [];
      }
    }
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

  async updateLetterStatus(letterToUpdate: LetterDto): Promise<Letter> {
    this.log.debug(`Updating letter ${letterToUpdate.id} to status ${letterToUpdate.status}`);
    let result: UpdateCommandOutput;
    try {
      let updateExpression = 'set #status = :status, updatedAt = :updatedAt, supplierStatus = :supplierStatus, #ttl = :ttl';
      let expressionAttributeValues : Record<string, any> = {
        ':status': letterToUpdate.status,
        ':updatedAt': new Date().toISOString(),
        ':supplierStatus': `${letterToUpdate.supplierId}#${letterToUpdate.status}`,
        ':ttl': Math.floor(Date.now() / 1000 + 60 * 60 * this.config.ttlHours)
      };

      if (letterToUpdate.reasonCode)
      {
        updateExpression += ', reasonCode = :reasonCode';
        expressionAttributeValues[':reasonCode'] = letterToUpdate.reasonCode;
      }

      if (letterToUpdate.reasonText)
      {
        updateExpression += ', reasonText = :reasonText';
        expressionAttributeValues[':reasonText'] = letterToUpdate.reasonText;
      }

      result = await this.ddbClient.send(new UpdateCommand({
        TableName: this.config.lettersTableName,
        Key: {
          supplierId: letterToUpdate.supplierId,
          id: letterToUpdate.id
        },
        UpdateExpression: updateExpression,
        ConditionExpression: 'attribute_exists(id)', // Ensure letter exists
        ExpressionAttributeNames: {
          '#status': 'status',
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
        throw new Error(`Letter with id ${letterToUpdate.id} not found for supplier ${letterToUpdate.supplierId}`);
      }
      throw error;
    }

    this.log.debug(`Updated letter ${letterToUpdate.id} to status ${letterToUpdate.status}`);
    return LetterSchema.parse(result.Attributes);
  }

  async getLettersBySupplier(supplierId: string, status: string, limit: number): Promise<LetterBase[]> {
    const supplierStatus = `${supplierId}#${status}`;
    const result = await this.ddbClient.send(new QueryCommand({
      TableName: this.config.lettersTableName,
      IndexName: 'supplierStatus-index',
      KeyConditionExpression: 'supplierStatus = :supplierStatus',
      Limit: limit,
      ExpressionAttributeNames: {
        '#status': 'status' // reserved keyword
      },
      ExpressionAttributeValues: {
        ':supplierStatus': supplierStatus
      },
      ProjectionExpression: 'id, #status, specificationId, groupId, reasonCode, reasonText'
    }));
    return z.array(LetterSchemaBase).parse(result.Items ?? []);
  }
}
