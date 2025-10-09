export type DatastoreConfig = {
  region: string,
  endpoint?: string,
  lettersTableName: string,
  miTableName: string,
  ttlHours: number
}
