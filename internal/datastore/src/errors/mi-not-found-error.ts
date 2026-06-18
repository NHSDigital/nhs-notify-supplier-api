/**
 * Error thrown when management information is not found in the database.
 */
export default class MiNotFoundError extends Error {
  constructor(
    public readonly supplierId: string,
    public readonly miId: string,
  ) {
    super(
      `Management information not found: supplierId=${supplierId}, miId=${miId}`,
    );
    this.name = "MiNotFoundError";
  }
}
