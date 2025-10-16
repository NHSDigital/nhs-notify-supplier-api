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
export { $EnvelopeProfile, type EnvelopeProfile } from './events/envelope-profile';

// Domain schemas
export {
  $LetterStatus,
  type LetterStatus,
  $Letter,
  type Letter,
} from './domain/letter';

// Event schemas (collection & generic)
export {
  letterEventMap,
  $LetterEvent,
  type LetterEvent,
} from './events/letter-events';

// Default export (optional): object grouping primary schemas
export default {
  $EnvelopeProfile: undefined as unknown as typeof import('./events/envelope-profile').$EnvelopeProfile, // placeholder for intellisense grouping only
  $LetterStatus: undefined as unknown as typeof import('./domain/letter').$LetterStatus,
  $Letter: undefined as unknown as typeof import('./domain/letter').$Letter,
  letterEventMap: undefined as unknown as typeof import('./events/letter-events').letterEventMap,
  $LetterEvent: undefined as unknown as typeof import('./events/letter-events').$LetterEvent,
};
