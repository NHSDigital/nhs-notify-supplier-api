/**
 * Error thrown when a supplier cannot be allocated due to incorrect supplier config
 */
export default class SupplierConfigError extends Error {
  constructor(public readonly message: string) {
    super(message);
    this.name = "SupplierConfigError";
  }
}
