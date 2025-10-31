import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { Supplier, SupplierSchema } from './types';
import { Logger } from 'pino';

export type SupplierRepositoryConfig = {
  suppliersTableName: string
};

export class SupplierRepository {
  constructor(readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: SupplierRepositoryConfig) {
  }

  async putSupplier(supplier: Omit<Supplier, 'updatedAt'>): Promise<Supplier> {

    const now = new Date().toISOString();
    const supplierDb = {
      ...supplier,
      updatedAt: now
    };

    await this.ddbClient.send(new PutCommand({
      TableName: this.config.suppliersTableName,
      Item: supplierDb,
    }));

    return SupplierSchema.parse(supplierDb);
  }

  async getSupplierById(supplierId: string): Promise<Supplier> {
    const result = await this.ddbClient.send(new GetCommand({
      TableName: this.config.suppliersTableName,
      Key: {
        id: supplierId
      }
    }));

    if (!result.Item) {
        throw new Error(`Supplier with id ${supplierId} not found`);
    }

    return SupplierSchema.parse(result.Item);
  }

  async getSupplierByApimId(apimId: string): Promise<Supplier> {
    const result = await this.ddbClient.send(new QueryCommand({
          TableName: this.config.suppliersTableName,
          IndexName: 'supplier-apim-index',
          KeyConditionExpression: 'apimId = :apimId',
          ExpressionAttributeValues: {
            ':apimId': apimId
          },
        }));

      if(result.Count && result.Count > 1) {
        throw new Error(`Multiple suppliers found with apimId ${apimId}`);
      }

      if(result.Count === 0 || !result.Items) {
        throw new Error(`Supplier with apimId ${apimId} not found`);
      }

      return SupplierSchema.parse(result.Items[0]);
  }
};
