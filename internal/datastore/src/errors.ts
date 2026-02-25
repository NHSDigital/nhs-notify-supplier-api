/**
 * Error thrown when attempting to create a letter that already exists in the database.
 */
// eslint-disable-next-line import-x/prefer-default-export
export class LetterAlreadyExistsError extends Error {
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
