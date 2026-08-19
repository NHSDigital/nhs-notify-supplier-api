/**
 * Error thrown when a letter is rejected due to violating pack constraints for all possible supplier packs.
 */
export default class RejectedError extends Error {
  constructor(public readonly message: string) {
    super(message);
    this.name = "RejectedError";
  }
}
