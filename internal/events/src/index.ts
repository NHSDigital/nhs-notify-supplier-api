/**
 * NHS Notify Supplier API Event Schemas
 *
 * This entrypoint re-exports the Zod schemas and associated TypeScript types
 * for letter status change events and supporting domain models.
 *
 * Public exports:
 *  - Envelope / CloudEvent profile base schema
 *  - Letter status domain enum & schema
 *  - Letter status change domain schema
 *  - Individual letter status change event schemas (statusChangeEvents map)
 *  - Generic letter status change event schema
 */

// Envelope / CloudEvents base profile
export {
  $EnvelopeProfile,
  type EnvelopeProfile,
} from "./events/envelope-profile";

// Domain schemas
export {
  $LetterStatus,
  type LetterStatus,
  $Letter,
  type Letter,
} from "./domain/letter";

// Event schemas (collection & generic)
export {
  letterEventMap,
  $LetterEvent,
  type LetterEvent,
} from "./events/letter-events";
