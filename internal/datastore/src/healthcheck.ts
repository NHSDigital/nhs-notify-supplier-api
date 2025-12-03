import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { LetterRepositoryConfig } from "./letter-repository";

export default class DBHealthcheck {
  constructor(
    readonly ddbClient: DynamoDBDocumentClient,
    readonly config: LetterRepositoryConfig,
  ) {}

  async check(): Promise<void> {
    await this.ddbClient.send(
      new DescribeTableCommand({
        TableName: this.config.lettersTableName,
      }),
    );
  }
}
