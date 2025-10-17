import {
  DynamoDBDocumentClient,
  PutCommand
} from '@aws-sdk/lib-dynamodb';
import { MI, MISchema } from './types';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

export type MIRepositoryConfig = {
  miTableName: string
};

export class MIRepository {
  constructor(readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: MIRepositoryConfig) {
  }

  async putMI(mi: Omit<MI, 'id' | 'createdAt' | 'updatedAt'>): Promise<MI> {

    const now = new Date().toISOString();
    const miDb = {
      ...mi,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    await this.ddbClient.send(new PutCommand({
      TableName: this.config.miTableName,
      Item: miDb
    }));

    return MISchema.parse(miDb);
  }
};
