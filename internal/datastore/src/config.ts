export type DatastoreConfig = {
  region: string,
  endpoint?: string,
  lettersTableName: string,
  miTableName: string,
  suppliersTableName: string,
  lettersTtlHours: number,
  miTtlHours: number
}
