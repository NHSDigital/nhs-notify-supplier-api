/**
 * Error thrown when attempting to create a letter that already exists in the database.
 */
export default class LetterAlreadyExistsError extends Error {
  constructor(
    public readonly supplierId: string,
    public readonly letterId: string,
  ) {
    super(
      `Letter already exists: supplierId=${supplierId}, letterId=${letterId}`,
    );
    this.name = "LetterAlreadyExistsError";
  }
}
