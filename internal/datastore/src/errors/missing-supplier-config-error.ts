/**
 * Error thrown when a supplier cannot be allocated due to missing supplier config
 */
export default class MissingSupplierConfigError extends Error {
  constructor(public readonly message: string) {
    super(message);
    this.name = "MissingSupplierConfigError";
  }
}
