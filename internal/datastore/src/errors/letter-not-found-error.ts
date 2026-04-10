/**
 * Error thrown when a letter is not found in the database.
 */
export default class LetterNotFoundError extends Error {
  constructor(
    public readonly supplierId: string,
    public readonly letterId: string,
  ) {
    super(`Letter not found: supplierId=${supplierId}, letterId=${letterId}`);
    this.name = "LetterNotFoundError";
  }
}
