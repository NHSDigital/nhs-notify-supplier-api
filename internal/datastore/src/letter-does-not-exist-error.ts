/**
 * Error thrown when attempting to delete a letter that does not exist in the database.
 */
// eslint-disable-next-line import-x/prefer-default-export
export class LetterDoesNotExistError extends Error {
  constructor(
    public readonly supplierId: string,
    public readonly letterId: string,
  ) {
    super(
      `Letter does not exist: supplierId=${supplierId}, letterId=${letterId}`,
    );
    this.name = "LetterDoesNotExistError";
  }
}
