import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { Logger } from "pino";
import { randomUUID } from "node:crypto";
import { MI, MISchema } from "./types";

export type MIRepositoryConfig = {
  miTableName: string;
  miTtlHours: number;
};

export class MIRepository {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly log: Logger,
    readonly config: MIRepositoryConfig,
  ) {}

  async putMI(
    mi: Omit<MI, "id" | "createdAt" | "updatedAt" | "ttl">,
  ): Promise<MI> {
    const now = new Date().toISOString();
    const miDb = {
      ...mi,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ttl: Math.floor(Date.now() / 1000 + 60 * 60 * this.config.miTtlHours),
    };

    await this.ddbClient.send(
      new PutCommand({
        TableName: this.config.miTableName,
        Item: miDb,
      }),
    );

    return MISchema.parse(miDb);
  }

    // TODO should the miId and supplierId be encapsulated in a getMIRequest 
    async getMI(
    miId: string,
    supplierId: string,
  ): Promise<MI> {

    const result = await this.ddbClient.send(
      new GetCommand({
        TableName: this.config.miTableName,
        Key: {
          id: miId,
          supplierId,
        },
      }),
    );

    if (!result.Item) {
      throw new Error(
        `Management Information with id ${miId} not found for supplier ${supplierId}`,
      );
    }

    return MISchema.parse(result.Item);
  }

}
