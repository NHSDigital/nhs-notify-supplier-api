export type DatastoreConfig = {
  region: string;
  endpoint?: string;
  lettersTableName: string;
  letterQueueTableName: string;
  miTableName: string;
  suppliersTableName: string;
  lettersTtlHours: number;
  letterQueueTtlHours: number;
  miTtlHours: number;
};
