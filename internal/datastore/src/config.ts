export type DatastoreConfig = {
  region: string,
  endpoint?: string,
  lettersTableName: string,
  miTableName: string,
  lettersTtlHours: number,
  miTtlHours: number
}
